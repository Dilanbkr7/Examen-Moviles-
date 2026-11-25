-- =====================================================================
-- Control Electoral - Seguridad: funciones de autorizacion, RLS, RPC y vistas
-- (ADR-002 Supabase RLS, ADR-006 PostgreSQL). Requisito R8.
-- La autorizacion real vive aqui, en el backend; la app solo oculta pantallas.
-- =====================================================================

-- ---------- Funciones auxiliares (security definer evita recursion de RLS) ----------
create or replace function public.rol_actual()
returns text language sql stable security definer set search_path = public as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.perfil_tiene_rol(p_usuario uuid, p_rol text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfiles where id = p_usuario and rol = p_rol)
$$;

create or replace function public.recinto_coordinado()
returns int language sql stable security definer set search_path = public as $$
  select recinto_id from public.asignaciones
  where usuario_id = auth.uid() and tipo = 'coordinador_recinto'
  limit 1
$$;

-- Lectura de una JRV: provincial todas; coordinador las de su recinto; veedor solo las asignadas.
create or replace function public.usuario_puede_acceder_jrv(p_jrv int)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_rol text := public.rol_actual();
begin
  if v_rol = 'coordinador_provincial' then return true; end if;
  if v_rol = 'coordinador_recinto' then
    return exists (select 1 from public.jrv j where j.id = p_jrv and j.recinto_id = public.recinto_coordinado());
  end if;
  if v_rol = 'veedor' then
    return exists (select 1 from public.asignaciones a
                   where a.tipo = 'veedor' and a.jrv_id = p_jrv and a.usuario_id = auth.uid());
  end if;
  return false;
end $$;

-- Escritura de actas/fotos: solo el veedor asignado o el coordinador del recinto (correcciones).
create or replace function public.usuario_puede_editar_jrv(p_jrv int)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_rol text := public.rol_actual();
begin
  if v_rol in ('coordinador_recinto', 'veedor') then
    return public.usuario_puede_acceder_jrv(p_jrv);
  end if;
  return false;
end $$;

create or replace function public.usuario_puede_ver_recinto(p_recinto int)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v_rol text := public.rol_actual();
begin
  if v_rol = 'coordinador_provincial' then return true; end if;
  if v_rol = 'coordinador_recinto' then return p_recinto = public.recinto_coordinado(); end if;
  if v_rol = 'veedor' then
    return exists (select 1 from public.asignaciones a
                   where a.tipo = 'veedor' and a.recinto_id = p_recinto and a.usuario_id = auth.uid());
  end if;
  return false;
end $$;

-- Extrae el ID de JRV de una ruta de Storage "ID_JRV/ID_ACTA.jpg" (ADR-003)
create or replace function public.jrv_de_ruta(p_ruta text)
returns int language sql immutable as $$
  select case when split_part(p_ruta, '/', 1) ~ '^[0-9]+$' then split_part(p_ruta, '/', 1)::int else null end
$$;

-- ---------- Activar RLS en todas las tablas ----------
alter table public.perfiles enable row level security;
alter table public.provincias enable row level security;
alter table public.cantones enable row level security;
alter table public.parroquias enable row level security;
alter table public.recintos enable row level security;
alter table public.jrv enable row level security;
alter table public.organizaciones enable row level security;
alter table public.candidaturas enable row level security;
alter table public.asignaciones enable row level security;
alter table public.actas enable row level security;
alter table public.detalle_votos enable row level security;

-- ---------- Politicas ----------
-- perfiles: cada uno ve el suyo; provincial ve todos; coordinador ve los veedores que creo o de su recinto.
-- No hay politicas de insert/update: las cuentas se crean en la Edge Function "crear-usuario".
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles for select to authenticated using (
  id = auth.uid()
  or public.rol_actual() = 'coordinador_provincial'
  or (public.rol_actual() = 'coordinador_recinto' and (
        creado_por = auth.uid()
        or exists (select 1 from public.asignaciones a
                   where a.usuario_id = perfiles.id and a.recinto_id = public.recinto_coordinado())))
);

-- Catalogos de solo lectura para usuarios autenticados
drop policy if exists provincias_select on public.provincias;
create policy provincias_select on public.provincias for select to authenticated using (true);
drop policy if exists cantones_select on public.cantones;
create policy cantones_select on public.cantones for select to authenticated using (true);
drop policy if exists parroquias_select on public.parroquias;
create policy parroquias_select on public.parroquias for select to authenticated using (true);
drop policy if exists organizaciones_select on public.organizaciones;
create policy organizaciones_select on public.organizaciones for select to authenticated using (true);
drop policy if exists candidaturas_select on public.candidaturas;
create policy candidaturas_select on public.candidaturas for select to authenticated using (true);

-- recintos: crear solo el coordinador provincial
drop policy if exists recintos_select on public.recintos;
create policy recintos_select on public.recintos for select to authenticated
  using (public.usuario_puede_ver_recinto(id));
drop policy if exists recintos_insert on public.recintos;
create policy recintos_insert on public.recintos for insert to authenticated
  with check (public.rol_actual() = 'coordinador_provincial');
drop policy if exists recintos_update on public.recintos;
create policy recintos_update on public.recintos for update to authenticated
  using (public.rol_actual() = 'coordinador_provincial')
  with check (public.rol_actual() = 'coordinador_provincial');

-- jrv: un veedor solo ve las mesas asignadas (demostracion de R8)
drop policy if exists jrv_select on public.jrv;
create policy jrv_select on public.jrv for select to authenticated
  using (public.usuario_puede_acceder_jrv(id));

-- asignaciones
drop policy if exists asignaciones_select on public.asignaciones;
create policy asignaciones_select on public.asignaciones for select to authenticated using (
  public.rol_actual() = 'coordinador_provincial'
  or usuario_id = auth.uid()
  or (public.rol_actual() = 'coordinador_recinto' and recinto_id = public.recinto_coordinado())
);

drop policy if exists asignaciones_insert on public.asignaciones;
create policy asignaciones_insert on public.asignaciones for insert to authenticated with check (
  (public.rol_actual() = 'coordinador_provincial' and tipo = 'coordinador_recinto'
     and public.perfil_tiene_rol(usuario_id, 'coordinador_recinto'))
  or
  (public.rol_actual() = 'coordinador_recinto' and tipo = 'veedor'
     and recinto_id = public.recinto_coordinado()
     and exists (select 1 from public.jrv j where j.id = jrv_id and j.recinto_id = asignaciones.recinto_id)
     and public.perfil_tiene_rol(usuario_id, 'veedor'))
);

drop policy if exists asignaciones_update on public.asignaciones;
create policy asignaciones_update on public.asignaciones for update to authenticated
using (
  (public.rol_actual() = 'coordinador_provincial' and tipo = 'coordinador_recinto')
  or (public.rol_actual() = 'coordinador_recinto' and tipo = 'veedor' and recinto_id = public.recinto_coordinado())
)
with check (
  (public.rol_actual() = 'coordinador_provincial' and tipo = 'coordinador_recinto'
     and public.perfil_tiene_rol(usuario_id, 'coordinador_recinto'))
  or
  (public.rol_actual() = 'coordinador_recinto' and tipo = 'veedor'
     and recinto_id = public.recinto_coordinado()
     and exists (select 1 from public.jrv j where j.id = jrv_id and j.recinto_id = asignaciones.recinto_id)
     and public.perfil_tiene_rol(usuario_id, 'veedor'))
);

-- actas: leer si puede acceder a la JRV; escribir/corregir veedor asignado o coordinador del recinto
drop policy if exists actas_select on public.actas;
create policy actas_select on public.actas for select to authenticated
  using (public.usuario_puede_acceder_jrv(jrv_id));
drop policy if exists actas_insert on public.actas;
create policy actas_insert on public.actas for insert to authenticated
  with check (public.usuario_puede_editar_jrv(jrv_id));
drop policy if exists actas_update on public.actas;
create policy actas_update on public.actas for update to authenticated
  using (public.usuario_puede_editar_jrv(jrv_id))
  with check (public.usuario_puede_editar_jrv(jrv_id));

-- detalle_votos: hereda el permiso del acta
drop policy if exists detalle_select on public.detalle_votos;
create policy detalle_select on public.detalle_votos for select to authenticated using (
  exists (select 1 from public.actas a where a.id = acta_id and public.usuario_puede_acceder_jrv(a.jrv_id)));
drop policy if exists detalle_insert on public.detalle_votos;
create policy detalle_insert on public.detalle_votos for insert to authenticated with check (
  exists (select 1 from public.actas a where a.id = acta_id and public.usuario_puede_editar_jrv(a.jrv_id)));
drop policy if exists detalle_update on public.detalle_votos;
create policy detalle_update on public.detalle_votos for update to authenticated
  using (exists (select 1 from public.actas a where a.id = acta_id and public.usuario_puede_editar_jrv(a.jrv_id)))
  with check (exists (select 1 from public.actas a where a.id = acta_id and public.usuario_puede_editar_jrv(a.jrv_id)));
drop policy if exists detalle_delete on public.detalle_votos;
create policy detalle_delete on public.detalle_votos for delete to authenticated using (
  exists (select 1 from public.actas a where a.id = acta_id and public.usuario_puede_editar_jrv(a.jrv_id)));

-- ---------- RPC ----------
-- Cambio obligatorio de contrasena (R3): solo marca la bandera del propio usuario.
create or replace function public.marcar_password_cambiada()
returns void language sql security definer set search_path = public as $$
  update public.perfiles set debe_cambiar_password = false where id = auth.uid();
$$;

-- Guardar o corregir un acta en UNA transaccion (SECURITY INVOKER: aplica RLS del usuario).
-- p_votos = [{"candidatura_id": 1, "votos": 10}, ...]
create or replace function public.guardar_acta(
  p_jrv_id int, p_dignidad text, p_total int, p_nulos int, p_blancos int, p_votos jsonb,
  p_latitud double precision, p_longitud double precision, p_precision double precision
) returns uuid language plpgsql security invoker set search_path = public as $$
declare v_id uuid;
begin
  if not public.usuario_puede_editar_jrv(p_jrv_id) then
    raise exception 'NO_AUTORIZADO: no tiene permiso para registrar actas de esta JRV';
  end if;

  select id into v_id from public.actas where jrv_id = p_jrv_id and dignidad = p_dignidad;

  if v_id is null then
    insert into public.actas (jrv_id, dignidad, total_sufragantes, votos_nulos, votos_blancos, latitud, longitud, precision_gps)
    values (p_jrv_id, p_dignidad, p_total, p_nulos, p_blancos, p_latitud, p_longitud, p_precision)
    returning id into v_id;
  else
    update public.actas set total_sufragantes = p_total, votos_nulos = p_nulos, votos_blancos = p_blancos,
      latitud = coalesce(p_latitud, latitud), longitud = coalesce(p_longitud, longitud),
      precision_gps = coalesce(p_precision, precision_gps)
    where id = v_id;
    delete from public.detalle_votos where acta_id = v_id;
  end if;

  insert into public.detalle_votos (acta_id, candidatura_id, votos)
  select v_id, (x->>'candidatura_id')::int, (x->>'votos')::int
  from jsonb_array_elements(p_votos) x;

  return v_id;
end $$;

grant execute on function public.guardar_acta(int, text, int, int, int, jsonb, double precision, double precision, double precision) to authenticated;
grant execute on function public.marcar_password_cambiada() to authenticated;

-- ---------- Vistas para tableros (security_invoker: respetan RLS del usuario) ----------
create or replace view public.v_mesas with (security_invoker = on) as
select j.id as jrv_id, j.numero, j.recinto_id, r.nombre as recinto,
       a.usuario_id as veedor_id,
       (select p.nombres || ' ' || p.apellidos from public.perfiles p where p.id = a.usuario_id) as veedor,
       exists (select 1 from public.actas x where x.jrv_id = j.id and x.dignidad = 'alcalde') as acta_alcalde,
       exists (select 1 from public.actas x where x.jrv_id = j.id and x.dignidad = 'prefecto') as acta_prefecto
from public.jrv j
join public.recintos r on r.id = j.recinto_id
left join public.asignaciones a on a.jrv_id = j.id and a.tipo = 'veedor';

create or replace view public.v_avance_recintos with (security_invoker = on) as
select r.id as recinto_id, r.nombre as recinto, pa.nombre as parroquia, ca.nombre as canton, r.num_jrv,
       r.num_jrv * 2 as actas_esperadas,
       (select count(*) from public.actas x join public.jrv j on j.id = x.jrv_id where j.recinto_id = r.id) as actas_registradas,
       (select count(*) from public.actas x join public.jrv j on j.id = x.jrv_id where j.recinto_id = r.id and x.foto_url is not null) as actas_con_foto,
       (select p.nombres || ' ' || p.apellidos from public.asignaciones a join public.perfiles p on p.id = a.usuario_id
         where a.recinto_id = r.id and a.tipo = 'coordinador_recinto' limit 1) as coordinador
from public.recintos r
join public.parroquias pa on pa.id = r.parroquia_id
join public.cantones ca on ca.id = pa.canton_id;

create or replace view public.v_resultados with (security_invoker = on) as
select j.recinto_id, r.nombre as recinto, x.dignidad, c.id as candidatura_id, c.nombre_candidato,
       o.siglas, o.nombre as organizacion, sum(d.votos)::int as votos
from public.detalle_votos d
join public.actas x on x.id = d.acta_id
join public.jrv j on j.id = x.jrv_id
join public.recintos r on r.id = j.recinto_id
join public.candidaturas c on c.id = d.candidatura_id
join public.organizaciones o on o.id = c.organizacion_id
group by j.recinto_id, r.nombre, x.dignidad, c.id, c.nombre_candidato, o.siglas, o.nombre;

create or replace view public.v_ubicaciones_actas with (security_invoker = on) as
select x.id as acta_id, x.dignidad, j.numero as jrv, r.nombre as recinto, x.latitud, x.longitud,
       x.precision_gps, x.created_at
from public.actas x
join public.jrv j on j.id = x.jrv_id
join public.recintos r on r.id = j.recinto_id;

grant select on public.v_mesas, public.v_avance_recintos, public.v_resultados, public.v_ubicaciones_actas to authenticated;
