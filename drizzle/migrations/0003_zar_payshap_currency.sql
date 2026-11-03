-- Swap the Swiss Franc wallet for the South African Rand and add the PayShap rail

-- 1. Accounts may be held in USD, EUR, GBP and ZAR
alter table public.accounts drop constraint accounts_currency_check;
alter table public.accounts add constraint accounts_currency_check check (currency in ('USD','EUR','GBP','ZAR'));

-- 2. Transactions: add the PayShap transfer type (legacy 'sic' rows stay valid)
alter table public.transactions drop constraint transactions_type_check;
alter table public.transactions add constraint transactions_type_check check (type in ('domestic_wire','swift','sepa','faster_payments','sic','payshap','exchange'));

-- 3. Exchange rates: USD/ZAR replaces USD/CHF
update public.exchange_rates
  set pair = 'USD/ZAR', rate = 18.20000000, change_24h = 0.0031, updated_at = now()
  where pair = 'USD/CHF';

-- 4. Fee schedule: PayShap instant Rand payment (same flat fee the SIC rail had)
create or replace function public.execute_transfer(
  _source_account_id uuid,
  _type text,
  _amount numeric,
  _counterparty_name text,
  _counterparty_details text,
  _reference text,
  _target_account_id uuid default null,
  _description text default null
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_src public.accounts;
  v_tgt public.accounts;
  v_fee numeric;
  v_rate numeric;
  v_target_amount numeric;
  v_tx uuid;
  v_today_total numeric;
  v_limit numeric;
begin
  select * into v_src from public.accounts where id = _source_account_id;
  if v_src.id is null or v_src.user_id <> auth.uid() then
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
    when 'payshap' then 2.00
    when 'exchange' then round(_amount * 0.001, 2)
    else 0 end;

  if _type = 'exchange' then
    if _target_account_id is null then
      raise exception 'Target account required for exchange';
    end if;
    select * into v_tgt from public.accounts where id = _target_account_id;
    if v_tgt.id is null or v_tgt.user_id <> auth.uid() then
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

    select coalesce(sum(amount), 0) into v_today_total
      from public.transactions
      where user_id = auth.uid() and direction = 'outgoing' and type <> 'exchange'
        and created_at >= date_trunc('day', now());
    select daily_transfer_limit into v_limit from public.profiles where id = auth.uid();
    if v_limit is not null and v_today_total + _amount > v_limit then
      raise exception 'Daily transfer limit exceeded. Remaining today: %', (v_limit - v_today_total);
    end if;
  end if;

  if v_src.balance < _amount + v_fee then
    raise exception 'Insufficient funds (amount + fee % exceeds balance)', v_fee;
  end if;

  update public.accounts set balance = balance - _amount - v_fee where id = v_src.id;

  if _type = 'exchange' then
    update public.accounts set balance = balance + v_target_amount where id = v_tgt.id;
  end if;

  insert into public.transactions (user_id, source_account_id, type, amount, currency, target_amount, target_currency, fx_rate, fee, counterparty_name, counterparty_details, reference, description, status)
    values (v_src.user_id, v_src.id, _type, _amount, v_src.currency, v_target_amount,
      case when _type = 'exchange' then v_tgt.currency end, v_rate, v_fee,
      case when _type = 'exchange' then 'Internal FX — ' || v_src.currency || ' to ' || v_tgt.currency else _counterparty_name end,
      case when _type = 'exchange' then 'Converted at rate ' || v_rate else _counterparty_details end,
      _reference, _description, 'completed')
    returning id into v_tx;

  return v_tx;
end;
$$;

GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, text, numeric, text, text, text, uuid, text) TO authenticated;

-- 5. New signups get a ZAR settlement account (FNB-style details) instead of CHF
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
  v_id uuid;
begin
  v_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  insert into public.profiles (id, display_name, email)
    values (new.id, v_name, new.email)
    returning id into v_id;

  insert into public.accounts (user_id, currency, balance, account_number, routing_number, iban, bic, sort_code, nickname) values
    (v_id, 'USD', 125400.00, public.generate_account_number(), '026009593', null, null, null, 'USD Treasury'),
    (v_id, 'EUR', 48750.00, null, null, public.generate_iban('DE', 22), 'DEUTDEFFXXX', null, 'EUR Operational'),
    (v_id, 'GBP', 32180.00, public.generate_account_number(), null, null, null, lpad((floor(random() * 899999) + 100000)::text, 6, '0'), 'GBP Settlement'),
    (v_id, 'ZAR', 1825538.00, public.generate_account_number(), '250655', null, 'FIRNZAJJ', null, 'ZAR Settlement');

  insert into public.transactions (user_id, type, amount, currency, counterparty_name, counterparty_details, reference, description, status, created_at) values
    (v_id, 'sepa', 2500.00, 'EUR', 'Rotterdam Consulting BV', 'DE89 3704 0044 0532 0130 00', 'INV-2026-0912', 'Consulting fees - September', 'completed', now() - interval '2 days'),
    (v_id, 'domestic_wire', 12500.00, 'USD', 'Meridian Freight LLC', 'Account 8842-1190, Routing 021000089', 'WIRE-88412', 'Freight settlement', 'completed', now() - interval '4 days'),
    (v_id, 'faster_payments', 1150.00, 'GBP', 'Harrowgate Estates', 'Sort 40-20-18, Acct 77129904', 'RENT-OCT', 'Office rent October', 'completed', now() - interval '6 days'),
    (v_id, 'payshap', 98544.50, 'ZAR', 'Cape Trade Partners (Pty) Ltd', 'FNB, Acct 6283-1140-221, Branch 250655', 'PS-22019', 'Custody fees', 'completed', now() - interval '9 days'),
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