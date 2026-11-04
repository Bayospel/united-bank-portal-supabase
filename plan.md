# United Bank Portal update plan

## Implementation approach

- Extend the Supabase profile model with residential address, employment, date of birth, and government-ID verification metadata. Capture these values at signup through auth metadata and persist them in the profile trigger; allow a government-ID file upload to the private `government-ids` storage bucket when a session is available.
- Remove seeded demo transaction inserts from the new-user trigger and clear existing transaction rows in a migration so history starts clean.
- Add a security-definer internal-transfer branch to the existing transfer RPC. Resolve a recipient by account number or IBAN, require a different user and matching currency, debit the sender and credit the recipient atomically, and create outgoing/incoming transaction records.
- Add a premium debit-card visual to the dashboard showing the account holder name and primary account details.

## Project structure

- `src/routes/auth.tsx`: signup fields and secure ID upload/request handling.
- `src/routes/_authenticated/dashboard.tsx` and `src/components/banking/debit-card.tsx`: dashboard card display and empty-state-safe recent activity.
- `src/routes/_authenticated/transfers.tsx`: internal-bank recipient flow.
- `src/lib/banking.functions.ts` and `src/integrations/supabase/types.ts`: typed server/RPC contracts.
- `drizzle/migrations/0004_account_verification_internal_transfers.sql`: schema, storage policies, clean-history trigger, and atomic transfer function.
