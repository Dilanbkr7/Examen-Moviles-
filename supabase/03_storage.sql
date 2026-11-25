-- =====================================================================
-- Control Electoral - Supabase Storage (ADR-003)
-- Bucket privado "actas", 10 MB, JPEG/PNG/WebP. Ruta: ID_JRV/ID_ACTA.jpg
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('actas', 'actas', false, 10485760, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists actas_fotos_select on storage.objects;
create policy actas_fotos_select on storage.objects for select to authenticated
  using (bucket_id = 'actas' and public.usuario_puede_acceder_jrv(public.jrv_de_ruta(name)));

drop policy if exists actas_fotos_insert on storage.objects;
create policy actas_fotos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'actas' and public.usuario_puede_editar_jrv(public.jrv_de_ruta(name)));

drop policy if exists actas_fotos_update on storage.objects;
create policy actas_fotos_update on storage.objects for update to authenticated
  using (bucket_id = 'actas' and public.usuario_puede_editar_jrv(public.jrv_de_ruta(name)))
  with check (bucket_id = 'actas' and public.usuario_puede_editar_jrv(public.jrv_de_ruta(name)));
