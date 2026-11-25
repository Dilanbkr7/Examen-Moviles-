-- =====================================================================
-- Control Electoral - Datos iniciales (R1). Datos de DEMOSTRACION.
-- Provincia: Pichincha. Canton: Quito. Organizaciones y candidaturas ficticias.
-- =====================================================================
insert into public.provincias (nombre) values ('Pichincha') on conflict do nothing;

insert into public.cantones (provincia_id, nombre)
select id, 'Quito' from public.provincias where nombre = 'Pichincha' on conflict do nothing;

insert into public.parroquias (canton_id, nombre)
select c.id, p.nombre from public.cantones c,
  (values ('Iñaquito'), ('La Magdalena'), ('Cotocollao'), ('Chillogallo')) as p(nombre)
where c.nombre = 'Quito' on conflict do nothing;

-- Los recintos generan sus JRV automaticamente (trigger trg_crear_jrv)
insert into public.recintos (parroquia_id, nombre, direccion, num_jrv)
select pa.id, r.nombre, r.direccion, r.num_jrv
from (values
  ('Iñaquito',     'Unidad Educativa Benalcázar',        'Av. 6 de Diciembre y Portugal', 4),
  ('La Magdalena', 'Colegio Nacional Mejía',             'Av. Vargas y Ante',             5),
  ('Cotocollao',   'Unidad Educativa Juan Pío Montúfar', 'Av. La Prensa y Vaca de Castro', 3),
  ('Chillogallo',  'Escuela Fiscal Quito Sur',           'Av. Mariscal Sucre S/N',        3)
) as r(parroquia, nombre, direccion, num_jrv)
join public.parroquias pa on pa.nombre = r.parroquia
on conflict do nothing;

insert into public.organizaciones (nombre, siglas, lista) values
  ('Movimiento Alianza Ciudadana',   'MAC', '1'),
  ('Partido Renovación Nacional',    'PRN', '2'),
  ('Movimiento Unidad Andina',       'MUA', '3'),
  ('Partido Democracia y Futuro',    'PDF', '4'),
  ('Movimiento Fuerza Comunitaria',  'MFC', '5')
on conflict do nothing;

insert into public.candidaturas (organizacion_id, dignidad, nombre_candidato)
select o.id, c.dignidad, c.nombre
from (values
  ('MAC', 'alcalde', 'Andrea Paredes'),  ('MAC', 'prefecto', 'Luis Cevallos'),
  ('PRN', 'alcalde', 'Jorge Villacís'),  ('PRN', 'prefecto', 'María Andrade'),
  ('MUA', 'alcalde', 'Carmen Tituaña'),  ('MUA', 'prefecto', 'Pedro Quishpe'),
  ('PDF', 'alcalde', 'Ricardo Mena'),    ('PDF', 'prefecto', 'Sofía Herrera'),
  ('MFC', 'alcalde', 'Elena Guamán'),    ('MFC', 'prefecto', 'Diego Salazar')
) as c(siglas, dignidad, nombre)
join public.organizaciones o on o.siglas = c.siglas
on conflict do nothing;

-- ---------------------------------------------------------------------
-- USUARIO INICIAL: Coordinador provincial (no hay autorregistro, R2).
-- 1) Supabase -> Authentication -> Users -> Add user -> Create new user
--    Email: TU_CORREO, Password: Ecuador2026, marcar "Auto Confirm User".
-- 2) Cambia TU_CORREO y la cedula abajo y ejecuta este bloque.
-- ---------------------------------------------------------------------
-- insert into public.perfiles (id, cedula, nombres, apellidos, telefono, correo, rol, debe_cambiar_password)
-- select id, '1710034065', 'Coordinador', 'Provincial', '0991234567', email, 'coordinador_provincial', true
-- from auth.users where email = 'TU_CORREO';
