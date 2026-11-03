-- New portal accounts start at zero; existing account rows and balances are not changed.
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

  insert into public.accounts (user_id, currency, balance, nickname) values
    (v_id, 'USD', 0.00, 'USD Account'),
    (v_id, 'EUR', 0.00, 'EUR Account'),
    (v_id, 'GBP', 0.00, 'GBP Account'),
    (v_id, 'ZAR', 0.00, 'ZAR Account');

  insert into public.security_events (user_id, event_type, created_at)
    values (v_id, 'Account created', now());

  insert into public.notifications (user_id, title, body, severity)
    values (
      v_id,
      'Welcome to United Bank Offshore',
      'Your portal accounts are ready with zero opening balances.',
      'info'
    );

  return new;
end;
$$;
