# Email via Resend (sign-up, password reset, welcome) + Customer Services chat

## 1. Vercel environment variables (never commit these)
| Name | Value |
|---|---|
| `RESEND_API_KEY` | your Resend API key |
| `RESEND_FROM_EMAIL` | `United Bank Offshore <no-reply@yourdomain.com>` |
| `SUPPORT_EMAIL` | inbox that receives chat messages |
| `APP_URL` | your live address, e.g. `https://your-app.vercel.app` (optional) |

Resend only delivers to arbitrary customers from a **domain you verified** (Resend → Domains). Until then it can only send from `onboarding@resend.dev` to your own Resend account email.

## 2. Make Supabase send sign-up / reset emails through Resend
Supabase dashboard → Authentication → Emails → SMTP Settings → enable **Custom SMTP**:
- Sender email: `no-reply@yourdomain.com` (same verified domain)
- Sender name: `United Bank Offshore`
- Host: `smtp.resend.com`
- Port: `465`
- Username: `resend`
- Password: your Resend API key

Then Authentication → Email Templates: paste `supabase/email-templates/confirmation.html` into **Confirm signup** (subject `Welcome to United Bank Offshore`) and `recovery.html` into **Reset password**.

## 3. Welcome email
Sent by the app through the Resend API the first time a client reaches the portal after signing in (so after confirming their email). Sent once per user.

## 4. Customer Services chat
Floating chat on every page: instant answers to common questions, plus "Talk to an agent", which emails the message to `SUPPORT_EMAIL` via Resend with the customer's address as Reply-To.
