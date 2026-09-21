-- A MAGIA DO SIM — Lista de convidados + RSVP público
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- 1) Cada casamento ganha um código público único para o link de confirmação.
alter table public.weddings
  add column if not exists rsvp_code uuid;

update public.weddings
set rsvp_code = gen_random_uuid()
where rsvp_code is null;

alter table public.weddings
  alter column rsvp_code set default gen_random_uuid();

alter table public.weddings
  alter column rsvp_code set not null;

create unique index if not exists weddings_rsvp_code_uidx
  on public.weddings(rsvp_code);

-- 2) Lista de convidados por casamento.
create table if not exists public.wedding_guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  full_name text not null,
  group_name text,
  age_group text not null default 'adult'
    check (age_group in ('adult','child')),
  phone text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','declined')),
  notes text,
  checked_in boolean not null default false,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wedding_guests_wedding_idx
  on public.wedding_guests(wedding_id);

create index if not exists wedding_guests_status_idx
  on public.wedding_guests(wedding_id,status);

create index if not exists wedding_guests_group_idx
  on public.wedding_guests(wedding_id,group_name);

-- 3) Segurança da área logada.
alter table public.wedding_guests enable row level security;

drop policy if exists "wedding_guests_select" on public.wedding_guests;
drop policy if exists "wedding_guests_insert" on public.wedding_guests;
drop policy if exists "wedding_guests_update" on public.wedding_guests;
drop policy if exists "wedding_guests_delete" on public.wedding_guests;

create policy "wedding_guests_select"
on public.wedding_guests
for select
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

create policy "wedding_guests_insert"
on public.wedding_guests
for insert
to authenticated
with check (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

create policy "wedding_guests_update"
on public.wedding_guests
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

create policy "wedding_guests_delete"
on public.wedding_guests
for delete
to authenticated
using (
  public.is_admin()
  or public.owns_wedding(wedding_id)
);

grant select, insert, update, delete on public.wedding_guests to authenticated;

-- 4) Atualização automática do updated_at.
create or replace function public.touch_wedding_guest_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_wedding_guest_updated_at on public.wedding_guests;
create trigger trg_touch_wedding_guest_updated_at
before update on public.wedding_guests
for each row execute procedure public.touch_wedding_guest_updated_at();

-- 5) Normalização simples para pesquisa de nomes com/sem acentos.
create or replace function public.normalize_guest_text(input_text text)
returns text
language sql
immutable
as $$
  select translate(
    lower(coalesce(input_text,'')),
    'áàãâäéèêëíìîïóòõôöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'
  );
$$;

-- 6) Dados públicos mínimos do casamento para a tela de RSVP.
create or replace function public.rsvp_get_wedding(wedding_code uuid)
returns table (
  couple_name text,
  wedding_date date,
  venue text
)
language sql
stable
security definer
set search_path = public
as $$
  select w.couple_name, w.wedding_date, w.venue
  from public.weddings w
  where w.rsvp_code = wedding_code
  limit 1;
$$;

-- 7) Pesquisa pública: exige pelo menos 3 caracteres.
-- Quando encontra alguém de uma família/grupo, retorna os integrantes desse mesmo grupo.
create or replace function public.rsvp_search_guests(
  wedding_code uuid,
  search_text text
)
returns table (
  id uuid,
  full_name text,
  group_name text,
  age_group text,
  status text
)
language sql
stable
security definer
set search_path = public
as $$
  with target_wedding as (
    select w.id
    from public.weddings w
    where w.rsvp_code = wedding_code
    limit 1
  ),
  matched as (
    select wg.id, wg.group_name
    from public.wedding_guests wg
    join target_wedding tw on tw.id = wg.wedding_id
    where length(trim(coalesce(search_text,''))) >= 3
      and public.normalize_guest_text(wg.full_name)
          like '%' || public.normalize_guest_text(trim(search_text)) || '%'
    order by wg.full_name
    limit 20
  ),
  matched_groups as (
    select distinct m.group_name
    from matched m
    where nullif(trim(m.group_name),'') is not null
  )
  select
    wg.id,
    wg.full_name,
    wg.group_name,
    wg.age_group,
    wg.status
  from public.wedding_guests wg
  join target_wedding tw on tw.id = wg.wedding_id
  where
    wg.id in (select m.id from matched m)
    or (
      nullif(trim(wg.group_name),'') is not null
      and wg.group_name in (select mg.group_name from matched_groups mg)
    )
  order by coalesce(wg.group_name,wg.full_name), wg.full_name
  limit 40;
$$;

-- 8) O convidado envia apenas as respostas dos IDs pertencentes ao casamento do link.
create or replace function public.rsvp_submit_responses(
  wedding_code uuid,
  responses jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wedding_id uuid;
  item jsonb;
  guest_uuid uuid;
  guest_status text;
  row_count integer;
  updated_count integer := 0;
begin
  select w.id
  into target_wedding_id
  from public.weddings w
  where w.rsvp_code = wedding_code
  limit 1;

  if target_wedding_id is null then
    return 0;
  end if;

  if responses is null or jsonb_typeof(responses) <> 'array' then
    return 0;
  end if;

  for item in
    select value from jsonb_array_elements(responses)
  loop
    begin
      guest_uuid := nullif(item->>'id','')::uuid;
    exception when others then
      guest_uuid := null;
    end;

    guest_status := item->>'status';

    if guest_uuid is not null
       and guest_status in ('confirmed','declined') then
      update public.wedding_guests wg
      set
        status = guest_status,
        responded_at = now()
      where wg.id = guest_uuid
        and wg.wedding_id = target_wedding_id;

      get diagnostics row_count = row_count;
      updated_count := updated_count + row_count;
    end if;
  end loop;

  return updated_count;
end;
$$;

grant execute on function public.rsvp_get_wedding(uuid) to anon, authenticated;
grant execute on function public.rsvp_search_guests(uuid,text) to anon, authenticated;
grant execute on function public.rsvp_submit_responses(uuid,jsonb) to anon, authenticated;
