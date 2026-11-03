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
