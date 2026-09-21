-- A MAGIA DO SIM — Foto de perfil do casal
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- Campo no casamento para guardar o caminho da foto.
alter table public.weddings
  add column if not exists couple_photo_path text;

-- Bucket privado para fotos dos casais.
insert into storage.buckets (id, name, public)
values ('couple-profile-photos', 'couple-profile-photos', false)
on conflict (id) do update set public = false;

-- ADMIN visualiza todas as fotos.
-- CLIENTE visualiza somente a foto da pasta do próprio casamento.
drop policy if exists "couple_profile_photos_select" on storage.objects;
create policy "couple_profile_photos_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'couple-profile-photos'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

-- ADMIN pode enviar para qualquer casamento.
-- CLIENTE pode enviar somente para a pasta do próprio casamento.
drop policy if exists "couple_profile_photos_insert" on storage.objects;
create policy "couple_profile_photos_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'couple-profile-photos'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

-- Mesma regra para substituir/remover a foto antiga.
drop policy if exists "couple_profile_photos_update" on storage.objects;
create policy "couple_profile_photos_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'couple-profile-photos'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
)
with check (
  bucket_id = 'couple-profile-photos'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

drop policy if exists "couple_profile_photos_delete" on storage.objects;
create policy "couple_profile_photos_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'couple-profile-photos'
  and (
    public.is_admin()
    or (
      (storage.foldername(name))[1] is not null
      and public.owns_wedding(((storage.foldername(name))[1])::uuid)
    )
  )
);

-- Função segura: permite alterar somente o campo da foto.
create or replace function public.set_couple_photo(
  wedding_uuid uuid,
  photo_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    public.is_admin()
    or exists (
      select 1
      from public.weddings w
      where w.id = wedding_uuid
        and w.client_user_id = auth.uid()
    )
  ) then
    raise exception 'Sem permissão para alterar a foto deste casamento';
  end if;

  update public.weddings
  set couple_photo_path = photo_path
  where id = wedding_uuid;
end;
$$;

grant execute on function public.set_couple_photo(uuid, text) to authenticated;
