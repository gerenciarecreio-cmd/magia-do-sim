-- A MAGIA DO SIM — Separar Outros Gastos e Lua de Mel
-- Execute UMA VEZ no Supabase SQL Editor antes de publicar esta versão.

alter table public.wedding_purchases
  add column if not exists expense_group text not null default 'other';

update public.wedding_purchases
set expense_group='other'
where expense_group is null
   or expense_group not in ('other','honeymoon');

alter table public.wedding_purchases
  drop constraint if exists wedding_purchases_expense_group_check;

alter table public.wedding_purchases
  add constraint wedding_purchases_expense_group_check
  check (expense_group in ('other','honeymoon'));

create index if not exists wedding_purchases_group_idx
  on public.wedding_purchases(wedding_id,expense_group);
