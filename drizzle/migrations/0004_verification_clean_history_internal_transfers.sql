alter table public.profiles
  add column if not exists residential_address text,
  add column if not exists employment_details text,
  add column if not exists date_of_birth date,
  add column if not exists government_id_status text not null default 'requested',
  add column if not exists government_id_path text;

-- Start the statement history cleanly. Future activity is created only by real transfers.
delete from public.transactions;

insert into storage.buckets (id, name, public)
values ('government-ids', 'government-ids', false)
on conflict (id) do nothing;

create policy "Users can upload their own government ID"
on storage.objects for insert to authenticated
with check (bucket_id = 'government-ids' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own government ID"
on storage.objects for select to authenticated
using (bucket_id = 'government-ids' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own government ID"
on storage.objects for update to authenticated
using (bucket_id = 'government-ids' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'government-ids' and (storage.foldername(name))[1] = auth.uid()::text);

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
  insert into public.profiles (
    id, display_name, email, residential_address, employment_details, date_of_birth,
    government_id_status
  ) values (
    new.id,
    v_name,
    new.email,
    nullif(new.raw_user_meta_data->>'residential_address', ''),
    nullif(new.raw_user_meta_data->>'employment_details', ''),
    nullif(new.raw_user_meta_data->>'date_of_birth', '')::date,
    case when coalesce(new.raw_user_meta_data->>'government_id_requested', 'true') = 'true' then 'requested' else 'not_submitted' end
  ) returning id into v_id;

  insert into public.accounts (user_id, currency, balance, account_number, routing_number, iban, bic, sort_code, nickname) values
    (v_id, 'USD', 0, public.generate_account_number(), '026009593', null, null, null, 'USD Treasury'),
    (v_id, 'EUR', 0, null, null, public.generate_iban('DE', 22), 'DEUTDEFFXXX', null, 'EUR Operational'),
    (v_id, 'GBP', 0, public.generate_account_number(), null, null, null, lpad((floor(random() * 899999) + 100000)::text, 6, '0'), 'GBP Settlement'),
    (v_id, 'CHF', 0, null, null, public.generate_iban('CH', 21), 'UBSWCHZH80A', null, 'CHF Private');

  insert into public.trusted_devices (user_id, name, platform, trusted) values
    (v_id, 'Current browser', 'Web', true);

  insert into public.security_events (user_id, event_type, device, ip_address, location) values
    (v_id, 'Account created', '—', '—', '—'),
    (v_id, 'Verification requested', '—', '—', '—');

  insert into public.notifications (user_id, title, body, severity) values
    (v_id, 'Welcome to United Bank Offshore', 'Your multi-currency accounts are ready. Complete verification to unlock transfers.', 'info'),
    (v_id, 'Verification required', 'Submit your government ID and profile details to complete account verification.', 'warning');

  return new;
end;
$$;

create or replace function public.execute_transfer(
  _source_account_id uuid,
  _type text,
  _amount numeric,
  _counterparty_name text,
  _counterparty_details text,
  _reference text,
  _target_account_id uuid default null,
  _description text default null,
  _target_account_identifier text default null
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
  v_recipient_name text;
  v_source_label text;
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
    when 'sic' then 2.00
    when 'exchange' then round(_amount * 0.001, 2)
    when 'internal_transfer' then 0
    else 0 end;

  if _type = 'internal_transfer' then
    if nullif(trim(_target_account_identifier), '') is null then
      raise exception 'Recipient account number or IBAN is required';
    end if;
    select * into v_tgt from public.accounts
      where (account_number = trim(_target_account_identifier) or iban = upper(trim(_target_account_identifier)))
        and status = 'active'
      limit 1;
    if v_tgt.id is null then
      raise exception 'Recipient account not found';
    end if;
    if v_tgt.user_id = auth.uid() then
      raise exception 'Choose another client account for an internal transfer';
    end if;
    if v_src.currency <> v_tgt.currency then
      raise exception 'Internal transfers must use matching currencies';
    end if;
    select coalesce(display_name, 'United Bank client') into v_recipient_name from public.profiles where id = v_tgt.user_id;
    v_source_label := coalesce(v_src.account_number, v_src.iban, 'United Bank account');
  elsif _type = 'exchange' then
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
    select rate into v_rate from public.exchange_rates where pair = v_src.currency || '/' || v_tgt.currency;
    if v_rate is null then
      select 1 / rate into v_rate from public.exchange_rates where pair = v_tgt.currency || '/' || v_src.currency;
    end if;
    v_target_amount := round(_amount * v_rate, 2);
  end if;

  if v_src.balance < _amount + v_fee then
    raise exception 'Insufficient funds (amount + fee % exceeds balance)', v_fee;
  end if;

  update public.accounts set balance = balance - _amount - v_fee where id = v_src.id;

  if _type = 'exchange' then
    update public.accounts set balance = balance + v_target_amount where id = v_tgt.id;
  elsif _type = 'internal_transfer' then
    update public.accounts set balance = balance + _amount where id = v_tgt.id;
  end if;

  insert into public.transactions (user_id, source_account_id, type, direction, amount, currency, target_amount, target_currency, fx_rate, fee, counterparty_name, counterparty_details, reference, description, status)
    values (v_src.user_id, v_src.id, _type, 'outgoing', _amount, v_src.currency, v_target_amount,
      case when _type = 'exchange' then v_tgt.currency end, v_rate, v_fee,
      case when _type = 'exchange' then 'Internal FX — ' || v_src.currency || ' to ' || v_tgt.currency else _counterparty_name end,
      case when _type = 'exchange' then 'Converted at rate ' || v_rate else _counterparty_details end,
      _reference, _description, 'completed') returning id into v_tx;

  if _type = 'internal_transfer' then
    insert into public.transactions (user_id, source_account_id, type, direction, amount, currency, fee, counterparty_name, counterparty_details, reference, description, status)
      values (v_tgt.user_id, v_tgt.id, _type, 'incoming', _amount, v_tgt.currency, 0,
        (select coalesce(display_name, 'United Bank client') from public.profiles where id = v_src.user_id),
        v_source_label, _reference, coalesce(_description, 'Internal transfer received'), 'completed');
  end if;

  return v_tx;
end;
$$;

grant execute on function public.execute_transfer(uuid, text, numeric, text, text, text, uuid, text, text) to authenticated;
