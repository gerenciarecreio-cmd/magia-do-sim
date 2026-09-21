-- A MAGIA DO SIM — complemento multiusuário
-- Execute uma vez no SQL Editor do Supabase ANTES de usar a versão nova do site.

alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    'client'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- Permissões da Data API. A segurança real continua sendo definida pelo RLS.
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.weddings to authenticated;
grant select, insert, update, delete on public.vendors to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.meetings to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.documents to authenticated;

-- Usuário pode alterar somente o próprio nome.
-- A permissão por coluna acima impede que um cliente altere role/email pelo navegador.
drop policy if exists "profile_update" on public.profiles;
create policy "profile_update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Garante que perfis client possam ser listados pelo administrador e que cada cliente veja o próprio perfil.
drop policy if exists "profile_select" on public.profiles;
create policy "profile_select"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());
