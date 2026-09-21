-- A MAGIA DO SIM — Cadastros gerais de fornecedores
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar a nova versão do site.
-- Esta migração preserva os fornecedores já vinculados aos casamentos.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  phone text,
  instagram text,
  website text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendors
  add column if not exists supplier_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_supplier_id_fkey'
      and conrelid = 'public.vendors'::regclass
  ) then
    alter table public.vendors
      add constraint vendors_supplier_id_fkey
      foreign key (supplier_id)
      references public.suppliers(id)
      on delete set null;
  end if;
end $$;

create index if not exists vendors_supplier_id_idx
  on public.vendors(supplier_id);

-- Converte os fornecedores atuais em cadastros gerais, sem apagar nenhum dado existente.
insert into public.suppliers (name, category, phone, instagram, website)
select distinct on (
  lower(trim(v.name)),
  lower(trim(coalesce(v.category, '')))
)
  v.name,
  v.category,
  nullif(v.phone, ''),
  nullif(v.instagram, ''),
  nullif(v.website, '')
from public.vendors v
where nullif(trim(v.name), '') is not null
  and not exists (
    select 1
    from public.suppliers s
    where lower(trim(s.name)) = lower(trim(v.name))
      and lower(trim(coalesce(s.category, ''))) = lower(trim(coalesce(v.category, '')))
  )
order by
  lower(trim(v.name)),
  lower(trim(coalesce(v.category, ''))),
  v.created_at nulls last;

-- Liga os registros antigos do casamento ao cadastro geral correspondente.
update public.vendors v
set supplier_id = s.id
from public.suppliers s
where v.supplier_id is null
  and lower(trim(s.name)) = lower(trim(v.name))
  and lower(trim(coalesce(s.category, ''))) = lower(trim(coalesce(v.category, '')));

alter table public.suppliers enable row level security;

-- ADMIN pode ver todos. CLIENT vê somente fornecedores já vinculados ao próprio casamento.
create or replace function public.can_view_supplier(supplier_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.vendors v
      join public.weddings w on w.id = v.wedding_id
      where v.supplier_id = supplier_uuid
        and w.client_user_id = auth.uid()
    );
$$;

grant execute on function public.can_view_supplier(uuid) to authenticated;

drop policy if exists "suppliers_select" on public.suppliers;
drop policy if exists "suppliers_insert_admin" on public.suppliers;
drop policy if exists "suppliers_update_admin" on public.suppliers;
drop policy if exists "suppliers_delete_admin" on public.suppliers;

create policy "suppliers_select"
on public.suppliers
for select
to authenticated
using (public.can_view_supplier(id));

create policy "suppliers_insert_admin"
on public.suppliers
for insert
to authenticated
with check (public.is_admin());

create policy "suppliers_update_admin"
on public.suppliers
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "suppliers_delete_admin"
on public.suppliers
for delete
to authenticated
using (public.is_admin());

grant select, insert, update, delete on public.suppliers to authenticated;

-- Mantém o cadastro geral sincronizado automaticamente quando for editado.
create or replace function public.touch_supplier_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_supplier_updated_at on public.suppliers;
create trigger trg_touch_supplier_updated_at
before update on public.suppliers
for each row execute procedure public.touch_supplier_updated_at();

-- Fim da migração.
