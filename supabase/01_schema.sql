-- =====================================================================
-- Control Electoral - Esquema PostgreSQL (ADR-006)
-- Ejecutar en Supabase -> SQL Editor, en este orden:
--   01_schema.sql, 02_seguridad.sql, 03_storage.sql, 04_seed.sql
-- =====================================================================

-- ---------- Perfiles y roles (R2) ----------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  cedula varchar(10) not null unique check (cedula ~ '^[0-9]{10}$'),
  nombres text not null check (length(trim(nombres)) > 1),
  apellidos text not null check (length(trim(apellidos)) > 1),
  telefono varchar(10) not null check (telefono ~ '^09[0-9]{8}$'),
  correo text not null unique,
  rol text not null check (rol in ('coordinador_provincial', 'coordinador_recinto', 'veedor')),
  debe_cambiar_password boolean not null default true,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Division territorial (R1) ----------
create table if not exists public.provincias (
  id serial primary key,
  nombre text not null unique
);

create table if not exists public.cantones (
  id serial primary key,
  provincia_id int not null references public.provincias(id),
  nombre text not null,
  unique (provincia_id, nombre)
);

create table if not exists public.parroquias (
  id serial primary key,
  canton_id int not null references public.cantones(id),
  nombre text not null,
  unique (canton_id, nombre)
);

create table if not exists public.recintos (
  id serial primary key,
  parroquia_id int not null references public.parroquias(id),
  nombre text not null,
  direccion text,
  num_jrv int not null check (num_jrv between 1 and 200),
  created_at timestamptz not null default now(),
  unique (parroquia_id, nombre)
);

create table if not exists public.jrv (
  id serial primary key,
  recinto_id int not null references public.recintos(id) on delete cascade,
  numero int not null check (numero > 0),
  unique (recinto_id, numero)
);

-- ---------- Organizaciones y candidaturas (R1) ----------
create table if not exists public.organizaciones (
  id serial primary key,
  nombre text not null unique,
  siglas text not null,
  lista text not null
);

create table if not exists public.candidaturas (
  id serial primary key,
  organizacion_id int not null references public.organizaciones(id),
  dignidad text not null check (dignidad in ('alcalde', 'prefecto')),
  nombre_candidato text not null,
  unique (organizacion_id, dignidad)
);

-- ---------- Asignaciones (R4, R5) ----------
-- tipo = coordinador_recinto -> recinto_id, jrv_id null (un coordinador por recinto)
-- tipo = veedor              -> recinto_id y jrv_id (un veedor por JRV, reasignable)
create table if not exists public.asignaciones (
  id serial primary key,
  usuario_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('coordinador_recinto', 'veedor')),
  recinto_id int not null references public.recintos(id) on delete cascade,
  jrv_id int references public.jrv(id) on delete cascade,
  asignado_por uuid references public.perfiles(id),
  updated_at timestamptz not null default now(),
  check ((tipo = 'coordinador_recinto' and jrv_id is null) or (tipo = 'veedor' and jrv_id is not null))
);
create unique index if not exists ux_coordinador_por_recinto
  on public.asignaciones (recinto_id) where tipo = 'coordinador_recinto';
create unique index if not exists ux_coordinador_un_recinto
  on public.asignaciones (usuario_id) where tipo = 'coordinador_recinto';
create unique index if not exists ux_veedor_por_jrv
  on public.asignaciones (jrv_id) where tipo = 'veedor';

-- ---------- Actas y votos (R6, R7) ----------
create table if not exists public.actas (
  id uuid primary key default gen_random_uuid(),
  jrv_id int not null references public.jrv(id) on delete cascade,
  dignidad text not null check (dignidad in ('alcalde', 'prefecto')),
  total_sufragantes int not null check (total_sufragantes >= 0),
  votos_nulos int not null default 0 check (votos_nulos >= 0),
  votos_blancos int not null default 0 check (votos_blancos >= 0),
  foto_url text,                       -- ruta dentro del bucket privado "actas" (ADR-003), no URL publica
  nitidez numeric,                     -- puntaje de nitidez calculado en la app antes de aceptar la foto
  latitud double precision check (latitud between -90 and 90),
  longitud double precision check (longitud between -180 and 180),
  precision_gps double precision,
  registrado_por uuid references public.perfiles(id) default auth.uid(),
  actualizado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (jrv_id, dignidad)
);

create table if not exists public.detalle_votos (
  id serial primary key,
  acta_id uuid not null references public.actas(id) on delete cascade,
  candidatura_id int not null references public.candidaturas(id),
  votos int not null check (votos >= 0),
  unique (acta_id, candidatura_id)
);

create index if not exists ix_actas_jrv on public.actas (jrv_id);
create index if not exists ix_detalle_acta on public.detalle_votos (acta_id);
create index if not exists ix_asig_usuario on public.asignaciones (usuario_id);

-- ---------- Triggers ----------

-- Al crear un recinto se generan automaticamente sus JRV (1..num_jrv)
create or replace function public.crear_jrv_de_recinto()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.jrv (recinto_id, numero)
  select new.id, g from generate_series(1, new.num_jrv) g
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists trg_crear_jrv on public.recintos;
create trigger trg_crear_jrv after insert on public.recintos
for each row execute function public.crear_jrv_de_recinto();

-- Regla de negocio R6: votos validos + nulos + blancos = total de sufragantes.
-- Es un CONSTRAINT TRIGGER diferido: se valida al final de la transaccion,
-- asi que ningun cliente puede guardar un acta inconsistente aunque salte la app.
create or replace function public.validar_totales_acta()
returns trigger language plpgsql as $$
declare
  v_acta uuid;
  v_total int; v_nulos int; v_blancos int; v_dignidad text;
  v_validos int; v_candidatos int; v_detalles int; v_mal_dignidad int;
begin
  if tg_table_name = 'actas' then
    v_acta := new.id;
  elsif tg_op = 'DELETE' then
    v_acta := old.acta_id;
  else
    v_acta := new.acta_id;
  end if;

  select total_sufragantes, votos_nulos, votos_blancos, dignidad
    into v_total, v_nulos, v_blancos, v_dignidad
  from public.actas where id = v_acta;
  if not found then return null; end if;

  select coalesce(sum(d.votos), 0), count(*),
         count(*) filter (where c.dignidad <> v_dignidad)
    into v_validos, v_detalles, v_mal_dignidad
  from public.detalle_votos d join public.candidaturas c on c.id = d.candidatura_id
  where d.acta_id = v_acta;

  select count(*) into v_candidatos from public.candidaturas where dignidad = v_dignidad;

  if v_mal_dignidad > 0 then
    raise exception 'ACTA_INCONSISTENTE: hay votos de candidaturas de otra dignidad';
  end if;
  if v_detalles <> v_candidatos then
    raise exception 'ACTA_INCONSISTENTE: se esperaban votos de % candidaturas y llegaron %', v_candidatos, v_detalles;
  end if;
  if v_validos + v_nulos + v_blancos <> v_total then
    raise exception 'ACTA_INCONSISTENTE: validos (%) + nulos (%) + blancos (%) no coincide con el total de sufragantes (%)',
      v_validos, v_nulos, v_blancos, v_total;
  end if;
  return null;
end $$;

drop trigger if exists trg_validar_acta on public.actas;
create constraint trigger trg_validar_acta after insert or update on public.actas
deferrable initially deferred for each row execute function public.validar_totales_acta();

drop trigger if exists trg_validar_detalle on public.detalle_votos;
create constraint trigger trg_validar_detalle after insert or update or delete on public.detalle_votos
deferrable initially deferred for each row execute function public.validar_totales_acta();

-- Auditoria simple de correcciones
create or replace function public.marcar_actualizacion_acta()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.actualizado_por := auth.uid();
  return new;
end $$;

drop trigger if exists trg_actas_updated on public.actas;
create trigger trg_actas_updated before update on public.actas
for each row execute function public.marcar_actualizacion_acta();
