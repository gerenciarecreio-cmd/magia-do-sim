-- A MAGIA DO SIM — Fornecedores dos noivos + Compras avulsas
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- 1) Permite que CLIENTE cadastre e edite fornecedores do próprio casamento.
-- Esses fornecedores podem ficar com supplier_id = NULL e NÃO entram
-- automaticamente no cadastro geral da assessoria.

drop policy if exists "vendors_insert_owner_or_admin" on public.vendors;
create policy "vendors_insert_owner_or_admin"
on public.vendors
for insert
to authenticated
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

drop policy if exists "vendors_update_owner_or_admin" on public.vendors;
create policy "vendors_update_owner_or_admin"
on public.vendors
for update
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
)
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

drop policy if exists "vendors_delete_owner_or_admin" on public.vendors;
create policy "vendors_delete_owner_or_admin"
on public.vendors
for delete
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

grant select, insert, update, delete on public.vendors to authenticated;

-- 2) Compras/pagamentos avulsos do casamento.

create table if not exists public.wedding_purchases (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  description text not null,
  category text,
  store_name text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  purchase_date date,
  payment_method text,
  status text not null default 'Pago'
    check (status in ('Pago','Pendente')),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wedding_purchases_wedding_idx
  on public.wedding_purchases(wedding_id);

create index if not exists wedding_purchases_date_idx
  on public.wedding_purchases(wedding_id,purchase_date);

alter table public.wedding_purchases enable row level security;

drop policy if exists "wedding_purchases_select_owner_or_admin" on public.wedding_purchases;
create policy "wedding_purchases_select_owner_or_admin"
on public.wedding_purchases
for select
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

drop policy if exists "wedding_purchases_insert_owner_or_admin" on public.wedding_purchases;
create policy "wedding_purchases_insert_owner_or_admin"
on public.wedding_purchases
for insert
to authenticated
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

drop policy if exists "wedding_purchases_update_owner_or_admin" on public.wedding_purchases;
create policy "wedding_purchases_update_owner_or_admin"
on public.wedding_purchases
for update
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
)
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

drop policy if exists "wedding_purchases_delete_owner_or_admin" on public.wedding_purchases;
create policy "wedding_purchases_delete_owner_or_admin"
on public.wedding_purchases
for delete
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

grant select, insert, update, delete on public.wedding_purchases to authenticated;

create or replace function public.touch_wedding_purchase_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_wedding_purchase_updated_at
on public.wedding_purchases;

create trigger trg_touch_wedding_purchase_updated_at
before update on public.wedding_purchases
for each row
execute procedure public.touch_wedding_purchase_updated_at();
