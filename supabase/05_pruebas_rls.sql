-- =====================================================================
-- Prueba de seguridad R8 (ejecutar en Supabase -> SQL Editor DESPUES de crear usuarios reales).
-- Simula ser un veedor y comprueba que solo ve sus JRV y no puede escribir en mesas ajenas.
-- Reemplace CEDULA_VEEDOR y ID_JRV_AJENA por valores reales.
-- =====================================================================
begin;
  select set_config('request.jwt.claims',
    json_build_object('sub', (select id from public.perfiles where cedula = 'CEDULA_VEEDOR'), 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1) Solo deben aparecer las JRV asignadas a este veedor
  select id, recinto_id, numero from public.jrv;

  -- 2) Debe devolver 0 filas: una JRV que no es suya
  select * from public.jrv where id = ID_JRV_AJENA;

  -- 3) Debe fallar con NO_AUTORIZADO
  select public.guardar_acta(ID_JRV_AJENA, 'alcalde', 10, 0, 10, '[]'::jsonb, null, null, null);
rollback;
