create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  preferred_currency text not null default 'USD',
  notifications_enabled boolean not null default true,
  biometric_enabled boolean not null default false,
  two_factor_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null check (currency in ('USD','EUR','GBP','CHF')),
  nickname text,
  balance numeric(18,2) not null default 0,
  account_number text,
  routing_number text,
  iban text,
  bic text,
  sort_code text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (user_id, currency)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_account_id uuid references public.accounts(id) on delete set null,
  type text not null check (type in ('domestic_wire','swift','sepa','faster_payments','sic','exchange')),
  direction text not null default 'outgoing',
  amount numeric(18,2) not null,
  currency text not null,
  target_amount numeric(18,2),
  target_currency text,
  fx_rate numeric(18,8),
  fee numeric(18,2) not null default 0,
  counterparty_name text,
  counterparty_details text,
  reference text,
  description text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  device text,
  ip_address text,
  location text,
  created_at timestamptz not null default now()
);

create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  platform text,
  trusted boolean not null default true,
  last_active timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  severity text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  pair text not null unique,
  rate numeric(18,8) not null,
  change_24h numeric(10,4) not null default 0,
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
GRANT SELECT, INSERT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
GRANT SELECT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
GRANT SELECT ON public.trusted_devices TO authenticated;
GRANT ALL ON public.trusted_devices TO service_role;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.exchange_rates TO authenticated;
GRANT ALL ON public.exchange_rates TO service_role;

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.security_events enable row level security;
alter table public.trusted_devices enable row level security;
alter table public.notifications enable row level security;
alter table public.exchange_rates enable row level security;

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users can view own accounts" on public.accounts for select to authenticated using (user_id = auth.uid());
create policy "Users can update own accounts" on public.accounts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users can view own transactions" on public.transactions for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own transactions" on public.transactions for insert to authenticated with check (user_id = auth.uid());
create policy "Users can view own security events" on public.security_events for select to authenticated using (user_id = auth.uid());
create policy "Users can view own trusted devices" on public.trusted_devices for select to authenticated using (user_id = auth.uid());
create policy "Users can view own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "Users can update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Authenticated can read exchange rates" on public.exchange_rates for select to authenticated using (true);

create or replace function public.generate_account_number()
returns text language sql volatile as $$
  select lpad((floor(random() * 899999999) + 100000000)::text, 9, '0')
$$;

create or replace function public.generate_iban(country_code text, length int)
returns text language sql volatile as $$
  select country_code || lpad((floor(random() * (power(10::bigint, length - 2) - 1))::text), length - 2, '0')
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_id uuid;
  v_seed numeric(18,8);
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  insert into public.profiles (id, display_name, email)
    values (new.id, v_name, new.email)
    returning id into v_id;

  insert into public.accounts (user_id, currency, balance, account_number, routing_number, iban, bic, sort_code, nickname) values
    (v_id, 'USD', 125400.00, public.generate_account_number(), '026009593', null, null, null, 'USD Treasury'),
    (v_id, 'EUR', 48750.00, null, null, public.generate_iban('DE', 22), 'DEUTDEFFXXX', null, 'EUR Operational'),
    (v_id, 'GBP', 32180.00, public.generate_account_number(), null, null, null, lpad((floor(random() * 899999) + 100000)::text, 6, '0'), 'GBP Settlement'),
    (v_id, 'CHF', 88920.00, null, null, public.generate_iban('CH', 21), 'UBSWCHZH80A', null, 'CHF Private');

  insert into public.transactions (user_id, type, amount, currency, counterparty_name, counterparty_details, reference, description, status, created_at) values
    (v_id, 'sepa', 2500.00, 'EUR', 'Zurich Consulting GmbH', 'DE89 3704 0044 0532 0130 00', 'INV-2026-0912', 'Consulting fees - September', 'completed', now() - interval '2 days'),
    (v_id, 'domestic_wire', 12500.00, 'USD', 'Meridian Freight LLC', 'Account 8842-1190, Routing 021000089', 'WIRE-88412', 'Freight settlement', 'completed', now() - interval '4 days'),
    (v_id, 'faster_payments', 1150.00, 'GBP', 'Harrowgate Estates', 'Sort 40-20-18, Acct 77129904', 'RENT-OCT', 'Office rent October', 'completed', now() - interval '6 days'),
    (v_id, 'sic', 4800.00, 'CHF', 'Bergen Trust AG', 'CH93 0076 2011 6238 5295 7', 'SIC-22019', 'Custody fees', 'completed', now() - interval '9 days'),
    (v_id, 'swift', 9800.00, 'USD', 'Aurora Holdings Ltd', 'SWIFT: ARORHKHH, Acct 5512-8890', 'SW-10442', 'Dividend distribution', 'completed', now() - interval '12 days');

  insert into public.trusted_devices (user_id, name, platform, trusted) values
    (v_id, 'MacBook Pro — Chrome', 'macOS', true),
    (v_id, 'iPhone 16 Pro', 'iOS', true);

  insert into public.security_events (user_id, event_type, device, ip_address, location, created_at) values
    (v_id, 'Account created', '—', '—', '—', now()),
    (v_id, '2FA enabled', '—', '—', '—', now());

  insert into public.notifications (user_id, title, body, severity) values
    (v_id, 'Welcome to United Bank Offshore', 'Your multi-currency accounts have been provisioned and are ready to use.', 'info'),
    (v_id, 'Security notice', 'Two-factor authentication is active on your account.', 'info');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.update_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_profiles_updated_at();

create or replace function public.execute_transfer(
  _source_account_id uuid,
  _type text,
  _amount numeric,
  _counterparty_name text,
  _counterparty_details text,
  _reference text,
  _target_account_id uuid default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid;
  v_src public.accounts;
  v_tgt public.accounts;
  v_fee numeric;
  v_rate numeric;
  v_target_amount numeric;
  v_tx uuid;
begin
  select id, user_id, currency, balance into v_src
    from public.accounts where id = _source_account_id;
  if v_src.user_id is null or v_src.user_id <> auth.uid() then
    raise exception 'Source account not found';
  end if;
  if _amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_fee := case _type
    when 'domestic_wire' then 15.00
    when 'swift' then 45.00
    when 'sepa' then 3.50
    when 'faster_payments' then 1.00
    when 'sic' then 2.00
    when 'exchange' then round(_amount * 0.001, 2)
    else 0 end;

  if _type = 'exchange' then
    if _target_account_id is null then
      raise exception 'Target account required for exchange';
    end if;
    select * into v_tgt from public.accounts where id = _target_account_id;
    if v_tgt.user_id is null or v_tgt.user_id <> auth.uid() then
      raise exception 'Target account not found';
    end if;
    if v_src.currency = v_tgt.currency then
      raise exception 'Cannot exchange to the same currency';
    end if;
    select rate into v_rate from public.exchange_rates
      where pair = v_src.currency || '/' || v_tgt.currency;
    if v_rate is null then
      select 1 / rate into v_rate from public.exchange_rates
        where pair = v_tgt.currency || '/' || v_src.currency;
    end if;
    v_target_amount := round(_amount * v_rate, 2);
  else
    v_rate := null;
    v_target_amount := null;
  end if;

  if v_src.balance < _amount + v_fee then
    raise exception 'Insufficient funds (amount + % fee exceeds balance)', v_fee;
  end if;

  update public.accounts set balance = balance - _amount - v_fee where id = v_src.id;

  if _type = 'exchange' then
    update public.accounts set balance = balance + v_target_amount where id = v_tgt.id;
  end if;

  insert into public.transactions (user_id, source_account_id, type, amount, currency, target_amount, target_currency, fx_rate, fee, counterparty_name, counterparty_details, reference, description, status)
    values (v_src.user_id, v_src.id, _type, _amount, v_src.currency, v_target_amount,
      case when _type = 'exchange' then v_tgt.currency end, v_rate, v_fee,
      case when _type = 'exchange' then 'Internal FX — ' || v_src.currency || ' to ' || v_tgt.currency else _counterparty_name end,
      case when _type = 'exchange' then 'Converted at ' || v_rate else _counterparty_details end,
      _reference, _description_marker, 'completed')
    returning id into v_tx;

  return v_tx;
end;
$$;

GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, text, numeric, text, text, text, uuid) TO authenticated;

insert into public.exchange_rates (pair, rate, change_24h) values
  ('EUR/USD', 1.0845, 0.0034),
  ('GBP/USD', 1.2730, -0.0019),
  ('USD/CHF', 0.8865, 0.0021)
on conflict (pair) do nothing;
