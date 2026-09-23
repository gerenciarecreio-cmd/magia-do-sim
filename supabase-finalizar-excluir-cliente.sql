-- A MAGIA DO SIM — Finalizar e excluir clientes
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

alter table public.weddings
  add column if not exists lifecycle_status text not null default 'active';

alter table public.weddings
  add column if not exists completed_at timestamptz;

alter table public.weddings
  add column if not exists deleted_at timestamptz;

alter table public.profiles
  add column if not exists client_status text not null default 'active';

alter table public.profiles
  add column if not exists deleted_at timestamptz;

update public.weddings
set lifecycle_status='active'
where lifecycle_status is null;

update public.profiles
set client_status='active'
where client_status is null;

create index if not exists weddings_lifecycle_status_idx
  on public.weddings(lifecycle_status);

create index if not exists profiles_client_status_idx
  on public.profiles(client_status);

create or replace function public.admin_finalize_client(wedding_uuid uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then
    raise exception 'Sem permissão';
  end if;

  update public.weddings
  set lifecycle_status='completed',
      completed_at=now(),
      deleted_at=null,
      updated_at=now()
  where id=wedding_uuid;
end;
$$;

create or replace function public.admin_reopen_client(wedding_uuid uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.is_admin() then
    raise exception 'Sem permissão';
  end if;

  update public.weddings
  set lifecycle_status='active',
      completed_at=null,
      deleted_at=null,
      updated_at=now()
  where id=wedding_uuid;

  update public.profiles p
  set client_status='active',
      deleted_at=null
  where p.id=(
    select w.client_user_id
    from public.weddings w
    where w.id=wedding_uuid
  );
end;
$$;

create or replace function public.admin_soft_delete_client(wedding_uuid uuid)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  target_client uuid;
begin
  if not public.is_admin() then
    raise exception 'Sem permissão';
  end if;

  select client_user_id
  into target_client
  from public.weddings
  where id=wedding_uuid;

  update public.weddings
  set lifecycle_status='deleted',
      deleted_at=now(),
      updated_at=now()
  where id=wedding_uuid;

  if target_client is not null then
    update public.profiles
    set client_status='deleted',
        deleted_at=now()
    where id=target_client;
  end if;
end;
$$;

grant execute on function public.admin_finalize_client(uuid) to authenticated;
grant execute on function public.admin_reopen_client(uuid) to authenticated;
grant execute on function public.admin_soft_delete_client(uuid) to authenticated;
