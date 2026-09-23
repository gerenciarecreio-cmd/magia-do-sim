-- A MAGIA DO SIM — CERIMONIAL + CASA + LUA DE MEL
-- Banco ORIGINAL da assessoria.
-- Noivos e assessoria têm permissão de edição no mesmo casamento.

create extension if not exists pgcrypto;

create or replace function public.touch_assessoria_module_row()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  return new;
end;
$$;

create table if not exists public.ceremony_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  section text not null default 'Agenda',
  title text not null,
  scheduled_time time,
  order_index integer not null default 1,
  responsible text,
  participants text,
  music text,
  vendor text,
  location text,
  notes text,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.module_financial_entries (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  module_slug text not null check(module_slug in ('cerimonial','organizacao-casa','lua-de-mel')),
  description text not null,
  category text,
  amount numeric(12,2) not null default 0 check(amount>=0),
  paid_amount numeric(12,2) not null default 0 check(paid_amount>=0),
  due_date date,
  status text not null default 'Pendente' check(status in ('Pendente','Parcial','Pago')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_organization_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  room text not null default 'Cozinha',
  item_name text not null,
  owned_quantity integer not null default 0 check(owned_quantity>=0),
  quantity integer not null default 1 check(quantity>=1),
  item_size text,
  priority text not null default 'Importante',
  acquisition_status text not null default 'Falta' check(acquisition_status in ('Falta','Comprado','Presenteado')),
  unit_value numeric(12,2) not null default 0 check(unit_value>=0),
  store_name text,
  item_link text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_item_payments (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  item_id uuid not null references public.home_organization_items(id) on delete cascade,
  amount numeric(12,2) not null check(amount>0),
  payment_date date,
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.honeymoon_planner_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  section text not null default 'Roteiro' check(section in ('Roteiro','Reservas','Documentos')),
  title text not null,
  item_date date,
  item_time time,
  category text,
  location text,
  provider text,
  confirmation_code text,
  item_link text,
  status text not null default 'Planejado' check(status in ('Planejado','Reservado','Confirmado','Concluído')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wedding_purchases
  add column if not exists expense_group text not null default 'other'
  check(expense_group in ('other','honeymoon'));

create table if not exists public.ceremony_share_links (
  wedding_id uuid primary key references public.weddings(id) on delete cascade,
  share_code uuid not null unique default gen_random_uuid(),
  active boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['ceremony_items','module_financial_entries','home_organization_items','home_item_payments','honeymoon_planner_items','ceremony_share_links']
  loop
    execute format('alter table public.%I enable row level security',t);
  end loop;
end $$;

-- Políticas: ADMIN OU dono do casamento. Ambos podem ler, criar, editar e excluir.
drop policy if exists "ceremony_items_owner_admin" on public.ceremony_items;
create policy "ceremony_items_owner_admin" on public.ceremony_items for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

drop policy if exists "module_financial_entries_owner_admin" on public.module_financial_entries;
create policy "module_financial_entries_owner_admin" on public.module_financial_entries for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

drop policy if exists "home_organization_items_owner_admin" on public.home_organization_items;
create policy "home_organization_items_owner_admin" on public.home_organization_items for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

drop policy if exists "home_item_payments_owner_admin" on public.home_item_payments;
create policy "home_item_payments_owner_admin" on public.home_item_payments for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

drop policy if exists "honeymoon_planner_items_owner_admin" on public.honeymoon_planner_items;
create policy "honeymoon_planner_items_owner_admin" on public.honeymoon_planner_items for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

drop policy if exists "ceremony_share_links_owner_admin" on public.ceremony_share_links;
create policy "ceremony_share_links_owner_admin" on public.ceremony_share_links for all to authenticated
using(public.is_admin() or public.owns_wedding(wedding_id))
with check(public.is_admin() or public.owns_wedding(wedding_id));

grant select,insert,update,delete on public.ceremony_items,public.module_financial_entries,public.home_organization_items,public.home_item_payments,public.honeymoon_planner_items,public.ceremony_share_links to authenticated;

do $$
declare t text;
begin
  foreach t in array array['ceremony_items','module_financial_entries','home_organization_items','home_item_payments','honeymoon_planner_items','ceremony_share_links']
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute procedure public.touch_assessoria_module_row()',t,t);
  end loop;
end $$;

create or replace function public.validate_home_item_payment_wedding()
returns trigger language plpgsql as $$
begin
  if not exists(select 1 from public.home_organization_items i where i.id=new.item_id and i.wedding_id=new.wedding_id) then
    raise exception 'O item não pertence a este casamento';
  end if;
  return new;
end;
$$;
drop trigger if exists trg_validate_home_item_payment_wedding on public.home_item_payments;
create trigger trg_validate_home_item_payment_wedding before insert or update on public.home_item_payments for each row execute procedure public.validate_home_item_payment_wedding();

create or replace function public.ceremony_get_or_create_share_link(wedding_uuid uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid;
begin
  if not(public.is_admin() or public.owns_wedding(wedding_uuid)) then raise exception 'Sem permissão'; end if;
  insert into public.ceremony_share_links(wedding_id,active,created_by)
  values(wedding_uuid,true,auth.uid())
  on conflict(wedding_id) do update set active=true,updated_at=now()
  returning share_code into c;
  return c;
end;
$$;

create or replace function public.ceremony_regenerate_share_link(wedding_uuid uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare c uuid;
begin
  if not(public.is_admin() or public.owns_wedding(wedding_uuid)) then raise exception 'Sem permissão'; end if;
  insert into public.ceremony_share_links(wedding_id,share_code,active,created_by)
  values(wedding_uuid,gen_random_uuid(),true,auth.uid())
  on conflict(wedding_id) do update set share_code=gen_random_uuid(),active=true,updated_at=now()
  returning share_code into c;
  return c;
end;
$$;

create or replace function public.ceremony_set_share_active(wedding_uuid uuid,enabled boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if not(public.is_admin() or public.owns_wedding(wedding_uuid)) then raise exception 'Sem permissão'; end if;
  update public.ceremony_share_links set active=enabled,updated_at=now() where wedding_id=wedding_uuid;
end;
$$;

create or replace function public.ceremony_public_snapshot(link_code uuid)
returns jsonb language sql stable security definer set search_path=public as $$
  select jsonb_build_object(
    'wedding',jsonb_build_object('couple_name',w.couple_name,'wedding_date',w.wedding_date,'wedding_time',w.wedding_time,'venue',w.venue),
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',ci.id,'section',ci.section,'title',ci.title,'scheduled_time',ci.scheduled_time,'order_index',ci.order_index,
      'responsible',ci.responsible,'participants',ci.participants,'music',ci.music,'vendor',ci.vendor,'location',ci.location,
      'notes',ci.notes,'completed',ci.completed
    ) order by ci.scheduled_time nulls last,ci.order_index,ci.created_at) from public.ceremony_items ci where ci.wedding_id=w.id),'[]'::jsonb)
  )
  from public.ceremony_share_links sl join public.weddings w on w.id=sl.wedding_id
  where sl.share_code=link_code and sl.active=true limit 1;
$$;

grant execute on function public.ceremony_get_or_create_share_link(uuid) to authenticated;
grant execute on function public.ceremony_regenerate_share_link(uuid) to authenticated;
grant execute on function public.ceremony_set_share_active(uuid,boolean) to authenticated;
grant execute on function public.ceremony_public_snapshot(uuid) to anon,authenticated;
