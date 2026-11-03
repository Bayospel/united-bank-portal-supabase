# United Bank Portal

Create a fully responsive, mobile-first professional online banking web application for "United Bank Offshore" using the attached official logo.

### Brand & Visual Identity
- **Logo Integration:** Prominently feature the uploaded official "United Bank Offshore" logo in the header, navigation, and auth screens.
- **Color Palette:**
  - Primary / Headers: Deep Midnight Navy (#0B1D3A)
  - Accent / Actions / Highlights: Rich Gold (#C5A059)
  - Backgrounds: Crisp clean whites and subtle off-white / light slate (#F8FAFC) for premium readability.

### Core Layout & Navigation
- **Mobile-First Responsive Design:** Optimized for mobile touchscreens with bottom navigation bar, scaling smoothly to tablet and desktop with an executive sidebar.
- **Top Bar:** Center or left-align the official logo, hamburger menu for secondary options, notifications bell, and encrypted security/session status.
- **Bottom Navigation Bar (Mobile View):** Fixed tabs for:
  1. Dashboard (Home)
  2. Transfers & Payments (Wire)
  3. My Accounts (Multi-Currency Wallets)
  4. Security & Compliance (MFA / Settings)

### Dashboard Interface (Post-Login)
- **Welcome Header:** Personalized greeting ("Good morning, Alexander Vance") with last-login timestamp and active session badge.
- **Consolidated Net Worth Card:** Summary card displaying total estimated value in USD with trend indicator and asset allocation breakdown.
- **Multi-Currency Asset Cards (4 Core Currencies):** Interactive wallet cards with quick actions:
  - 🇺🇸 USD Account (Balance, Account/Routing #, "View Statement", "Send Wire")
  - 🇪🇺 EUR Account (Balance, IBAN/BIC, "View Statement", "SEPA Transfer")
  - 🇬🇧 GBP Account (Balance, Sort Code/Acc #, "View Statement", "Faster Payments")
  - 🇨🇭 CHF Account (Balance, Swiss IBAN, "View Statement", "SIC Transfer")
- **Sidebar / Secondary Modules:**
  - Global Market Watch: Live exchange rate ticker with sparklines (EUR/USD, GBP/USD, USD/CHF).
  - Security Alerts & Audit Log: Real-time 2FA status, recognized devices, and recent login activity.

### Transfers & Interactive Features
- **Wire Transfer Modal / Flow:** Step-by-step transfer wizard supporting Domestic Wire, SWIFT International, SEPA, and internal currency exchange with real-time conversion rates and fee estimation.
- **Transaction History:** Filterable table/feed with download statement (CSV/PDF) and transaction details.
- **Security & Compliance Tab:** 2FA settings, biometric toggle, transaction limits, and device management.
- Includes an illustrative portal preview and Supabase authentication integration; no live banking or real funds are provided.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1ab1147c-6726-4593-8454-a7e34c70ff6d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
