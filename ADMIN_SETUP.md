# United Bank Offshore admin setup

The admin console is available at `/admin` only when the signed-in profile has `role = 'admin'`. The database migration protects both customer listing and balance credits with the same role check; hiding the link is not the security boundary.

After applying the migrations, promote a trusted operator from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin'
where email = 'trusted-admin@example.com';
```

The admin console shows customer registration and verification details, current accounts, and an audited Add money action. Every credit requires a positive amount and a note and creates both a customer transaction and an `admin_balance_adjustments` record.

Supabase controls the confirmation-email sender and subject outside the frontend. In **Authentication → Email Templates → Confirm signup**, set the subject to `Welcome to United Bank Offshore` and paste the HTML from `supabase/email-templates/confirmation.html` into the template body. The same branded bank name is already used in the application title and link-preview metadata.
