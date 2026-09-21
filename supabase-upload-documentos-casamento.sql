-- A MAGIA DO SIM — Upload privado de documentos do casamento
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- Bucket privado para contratos, orçamentos e demais documentos dos casamentos.
insert into storage.buckets (id, name, public)
values ('wedding-documents', 'wedding-documents', false)
on conflict (id) do update set public = false;

-- Leitura:
-- ADMIN pode visualizar todos.
-- CLIENTE pode visualizar apenas arquivos dentro da pasta do próprio casamento.
drop policy if exists "wedding_documents_storage_select" on storage.objects;
create policy "wedding_documents_storage_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'wedding-documents'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

-- Somente ADMIN envia documentos nesta área.
drop policy if exists "wedding_documents_storage_insert_admin" on storage.objects;
create policy "wedding_documents_storage_insert_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wedding-documents'
  and public.is_admin()
);

-- Somente ADMIN pode substituir/remover arquivos.
drop policy if exists "wedding_documents_storage_update_admin" on storage.objects;
create policy "wedding_documents_storage_update_admin"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wedding-documents'
  and public.is_admin()
)
with check (
  bucket_id = 'wedding-documents'
  and public.is_admin()
);

drop policy if exists "wedding_documents_storage_delete_admin" on storage.objects;
create policy "wedding_documents_storage_delete_admin"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wedding-documents'
  and public.is_admin()
);
