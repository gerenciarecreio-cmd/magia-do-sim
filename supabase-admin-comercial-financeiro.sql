-- A MAGIA DO SIM — Módulo administrativo comercial + financeiro
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

-- 1) Eventos/CRM: o mesmo registro alimenta CRM e calendário.
create table if not exists public.company_events (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  phone text,
  event_date date,
  event_time time,
  venue text,
  service_sector text not null default 'Assessoria completa'
    check (service_sector in ('Assessoria completa','Decoração','Serviços terceirizados')),
  status text not null default 'Cliente interessado'
    check (status in (
      'Cliente interessado',
      'Cliente validou proposta',
      'Cliente fechado',
      'Contrato assinado e sinal dado'
    )),
  proposal_value numeric(12,2) not null default 0,
  contracted_value numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Agenda de reuniões comercial.
create table if not exists public.company_meetings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.company_events(id) on delete set null,
  client_name text not null,
  meeting_date date not null,
  meeting_time time,
  meeting_type text,
  notes text,
  created_at timestamptz not null default now()
);

-- 3) Financeiro da empresa.
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  entry_type text not null
    check (entry_type in ('Entrada','Saída','Remuneração staff')),
  description text not null,
  service_sector text
    check (service_sector is null or service_sector in ('Assessoria completa','Decoração','Serviços terceirizados')),
  category text,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  status text not null default 'Pendente'
    check (status in ('Previsto','Pendente','Recebido','Pago')),
  event_id uuid references public.company_events(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists company_events_date_idx on public.company_events(event_date);
create index if not exists company_events_status_idx on public.company_events(status);
create index if not exists company_events_sector_idx on public.company_events(service_sector);
create index if not exists company_meetings_date_idx on public.company_meetings(meeting_date);
create index if not exists financial_entries_date_idx on public.financial_entries(entry_date);
create index if not exists financial_entries_event_idx on public.financial_entries(event_id);
create index if not exists financial_entries_sector_idx on public.financial_entries(service_sector);

-- 4) Documentos/contratos de cada evento.
create table if not exists public.event_documents (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.company_events(id) on delete cascade,
  name text not null,
  file_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists event_documents_event_idx on public.event_documents(event_id);

-- Bucket privado para contratos/documentos.
insert into storage.buckets (id, name, public)
values ('event-documents', 'event-documents', false)
on conflict (id) do update set public = false;

-- 5) RLS: módulo comercial/financeiro é somente ADMIN.
alter table public.company_events enable row level security;
alter table public.company_meetings enable row level security;
alter table public.financial_entries enable row level security;
alter table public.event_documents enable row level security;

drop policy if exists "company_events_admin_all" on public.company_events;
create policy "company_events_admin_all"
on public.company_events for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "company_meetings_admin_all" on public.company_meetings;
create policy "company_meetings_admin_all"
on public.company_meetings for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "financial_entries_admin_all" on public.financial_entries;
create policy "financial_entries_admin_all"
on public.financial_entries for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "event_documents_admin_all" on public.event_documents;
create policy "event_documents_admin_all"
on public.event_documents for all to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.company_events to authenticated;
grant select, insert, update, delete on public.company_meetings to authenticated;
grant select, insert, update, delete on public.financial_entries to authenticated;
grant select, insert, update, delete on public.event_documents to authenticated;

-- Storage: somente admin pode ler/enviar/editar/remover documentos do módulo comercial.
drop policy if exists "event_documents_storage_select_admin" on storage.objects;
drop policy if exists "event_documents_storage_insert_admin" on storage.objects;
drop policy if exists "event_documents_storage_update_admin" on storage.objects;
drop policy if exists "event_documents_storage_delete_admin" on storage.objects;

create policy "event_documents_storage_select_admin"
on storage.objects for select to authenticated
using (bucket_id = 'event-documents' and public.is_admin());

create policy "event_documents_storage_insert_admin"
on storage.objects for insert to authenticated
with check (bucket_id = 'event-documents' and public.is_admin());

create policy "event_documents_storage_update_admin"
on storage.objects for update to authenticated
using (bucket_id = 'event-documents' and public.is_admin())
with check (bucket_id = 'event-documents' and public.is_admin());

create policy "event_documents_storage_delete_admin"
on storage.objects for delete to authenticated
using (bucket_id = 'event-documents' and public.is_admin());

-- Atualiza updated_at dos eventos.
create or replace function public.touch_company_event_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_company_event_updated_at on public.company_events;
create trigger trg_touch_company_event_updated_at
before update on public.company_events
for each row execute procedure public.touch_company_event_updated_at();
