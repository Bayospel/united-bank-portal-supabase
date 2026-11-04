alter table public.profiles
  add column if not exists role text not null default 'customer';

alter table public.accounts drop constraint if exists accounts_currency_check;
alter table public.accounts add constraint accounts_currency_check check (currency in ('USD','EUR','GBP','CHF','ZAR'));

alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (
  type in ('domestic_wire','swift','sepa','faster_payments','sic','payshap','exchange','internal_transfer','admin_credit')
);

create table if not exists public.admin_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.profiles(id),
  customer_user_id uuid not null references public.profiles(id),
  account_id uuid not null references public.accounts(id),
  amount numeric(18,2) not null check (amount > 0),
  note text not null,
  created_at timestamptz not null default now()
);

grant select on public.admin_balance_adjustments to authenticated;
grant all on public.admin_balance_adjustments to service_role;
alter table public.admin_balance_adjustments enable row level security;

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and role = 'admin'
  )
$$;

grant execute on function public.is_admin(uuid) to authenticated;

create or replace function public.admin_list_customers()
returns table (
  id uuid,
  display_name text,
  email text,
  residential_address text,
  employment_details text,
  date_of_birth date,
  government_id_status text,
  government_id_path text,
  created_at timestamptz,
  accounts jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required';
  end if;

  return query
  select p.id, p.display_name, p.email, p.residential_address, p.employment_details,
    p.date_of_birth, p.government_id_status, p.government_id_path, p.created_at,
    coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'currency', a.currency, 'balance', a.balance,
      'account_number', a.account_number, 'iban', a.iban, 'status', a.status
    ) order by a.currency) filter (where a.id is not null), '[]'::jsonb) as accounts
  from public.profiles p
  left join public.accounts a on a.user_id = p.id
  where p.role <> 'admin'
  group by p.id
  order by p.created_at desc;
end;
$$;

grant execute on function public.admin_list_customers() to authenticated;

create or replace function public.admin_credit_account(
  _account_id uuid,
  _amount numeric,
  _note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account public.accounts;
  v_tx uuid;
  v_reference text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Admin access required';
  end if;
  if _amount <= 0 then
    raise exception 'Credit amount must be positive';
  end if;
  if nullif(trim(_note), '') is null then
    raise exception 'A credit note is required';
  end if;

  select * into v_account from public.accounts where id = _account_id for update;
  if v_account.id is null then
    raise exception 'Customer account not found';
  end if;
  if v_account.user_id = auth.uid() then
    raise exception 'Admin accounts cannot be credited from this page';
  end if;

  update public.accounts set balance = balance + _amount where id = v_account.id;
  v_reference := 'ADMIN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.transactions (
    user_id, source_account_id, type, direction, amount, currency, fee,
    counterparty_name, counterparty_details, reference, description, status
  ) values (
    v_account.user_id, v_account.id, 'admin_credit', 'incoming', _amount, v_account.currency, 0,
    'United Bank Operations', 'Account credit approved by an administrator', v_reference, trim(_note), 'completed'
  ) returning id into v_tx;

  insert into public.admin_balance_adjustments (
    admin_user_id, customer_user_id, account_id, amount, note
  ) values (auth.uid(), v_account.user_id, v_account.id, _amount, trim(_note));

  return v_tx;
end;
$$;

grant execute on function public.admin_credit_account(uuid, numeric, text) to authenticated;
