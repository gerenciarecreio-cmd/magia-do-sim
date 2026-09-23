-- A MAGIA DO SIM — Upload de documentos pelos clientes
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- O bucket já existe e permanece privado.
insert into storage.buckets (id, name, public)
values ('wedding-documents', 'wedding-documents', false)
on conflict (id) do update set public = false;

-- CLIENTE e ADMIN podem enviar arquivos.
-- A primeira pasta do caminho continua sendo o UUID do casamento:
-- wedding-id/contratos/arquivo.pdf
-- wedding-id/pagamentos/comprovante.jpg
-- wedding-id/outros/documento.docx

drop policy if exists "wedding_documents_storage_insert_admin" on storage.objects;
drop policy if exists "wedding_documents_storage_insert_owner_or_admin" on storage.objects;

create policy "wedding_documents_storage_insert_owner_or_admin"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wedding-documents'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

-- Mantém a leitura privada: ADMIN vê todos e CLIENTE apenas o próprio casamento.
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

-- Permite cadastrar o registro do documento na tabela.
-- A política é adicional às políticas já existentes.
drop policy if exists "documents_insert_owner_or_admin" on public.documents;

create policy "documents_insert_owner_or_admin"
on public.documents
for insert
to authenticated
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

grant select, insert on public.documents to authenticated;
