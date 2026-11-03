import { Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, ShieldCheck, Wallet } from "lucide-react";

import { Logo } from "@/components/banking/logo";
import { Button } from "@/components/ui/button";

const CURRENCIES = [
  { code: "USD", name: "US dollar", amount: "$0.00" },
  { code: "EUR", name: "Euro", amount: "€0.00" },
  { code: "GBP", name: "British pound", amount: "£0.00" },
  { code: "ZAR", name: "South African rand", amount: "R 0.00" },
];

const FEATURES = [
  {
    icon: Wallet,
    title: "Multi-currency overview",
    text: "Review USD, EUR, GBP and ZAR account views together, with balances presented clearly.",
  },
  {
    icon: Globe2,
    title: "Cross-border workflows",
    text: "Explore payment options for domestic wires, SWIFT, SEPA, Faster Payments and PayShap.",
  },
  {
    icon: ShieldCheck,
    title: "Access and security",
    text: "Manage sign-in settings, trusted devices and recent security activity from one place.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-navy">
      <div className="border-b border-white/10 bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] sm:text-[11px]">
          <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
          <span>Portal preview</span>
          <span className="text-white/45">·</span>
          <span className="text-white/70">No live banking or real funds</span>
        </div>
      </div>

      <header className="sticky top-0 z-30 border-b border-navy/10 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex shrink-0 items-center"
            aria-label="United Bank Offshore home"
          >
            <Logo className="h-16 w-auto object-contain" />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
            <a
              className="text-sm text-muted-foreground transition-colors hover:text-navy"
              href="#services"
            >
              Services
            </a>
            <a
              className="text-sm text-muted-foreground transition-colors hover:text-navy"
              href="#currencies"
            >
              Currencies
            </a>
            <a
              className="text-sm text-muted-foreground transition-colors hover:text-navy"
              href="#security"
            >
              Security
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/auth">Client login</Link>
            </Button>
            <Button size="sm" className="shrink-0" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                <span className="hidden sm:inline">Open an account</span>
                <span className="sm:hidden">Open account</span>
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-muted/40" aria-labelledby="hero-title">
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] border-l border-navy/5 lg:block"
            aria-hidden="true"
          />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-10 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="landing-enter inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <span className="text-gold">01</span>
                <span className="h-px w-8 bg-gold" aria-hidden="true" />
                <span>Private client services</span>
              </p>
              <div className="landing-rule mt-5 h-px w-24 bg-gold" aria-hidden="true" />
              <h1
                id="hero-title"
                className="landing-enter landing-enter-delay-1 mt-5 max-w-xl font-display text-3xl font-bold leading-[1.12] text-navy sm:text-5xl lg:text-6xl"
              >
                Global banking.
                <br />
                <span className="text-gold">Borderless opportunities.</span>
              </h1>
              <p className="landing-enter landing-enter-delay-2 mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-lg">
                Explore a considered client-portal preview for multi-currency accounts and
                cross-border payment workflows, organized around clarity and control.
              </p>
              <div className="landing-enter landing-enter-delay-3 mt-6 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Open an account <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#services">Explore services</a>
                </Button>
              </div>
              <div className="landing-enter landing-enter-delay-4 mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-navy/10 pt-5 text-xs font-medium text-muted-foreground">
                <span>USD</span>
                <span aria-hidden="true">·</span>
                <span>EUR</span>
                <span aria-hidden="true">·</span>
                <span>GBP</span>
                <span aria-hidden="true">·</span>
                <span>ZAR</span>
                <span className="ml-1 text-navy/70">Four currencies in one view</span>
              </div>
            </div>

            <div className="landing-enter landing-enter-delay-3 relative lg:pl-6">
              <div
                className="pointer-events-none absolute -right-2 -top-3 hidden size-28 border border-gold/40 lg:block"
                aria-hidden="true"
              />
              <section
                className="landing-preview-card relative rounded-2xl border border-navy/10 bg-card p-6 shadow-lg sm:p-8"
                aria-labelledby="preview-title"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                      Illustrative account-opening view
                    </p>
                    <h2
                      id="preview-title"
                      className="mt-2 font-display text-xl font-semibold text-navy"
                    >
                      New account
                    </h2>
                  </div>
                  <span className="rounded-full border border-gold/40 bg-gold-soft px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy">
                    Preview
                  </span>
                </div>

                <div className="mt-8 border-b border-navy/10 pb-6">
                  <p className="text-xs text-muted-foreground">Opening balance</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="tabular font-display text-4xl font-bold text-navy sm:text-5xl">
                      $0.00
                    </p>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      USD
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5">
                  {CURRENCIES.map((currency) => (
                    <div key={currency.code} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-navy">{currency.code}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{currency.name}</p>
                      </div>
                      <p className="tabular text-xs font-medium text-navy">{currency.amount}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-7 flex items-start gap-2 border-t border-navy/10 pt-4">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                  <p className="text-xs leading-5 text-muted-foreground">
                    All illustrative opening balances are zero. No funds are held or moved.
                  </p>
                </div>
              </section>
              <p className="mt-4 flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="text-gold">01 / 04</span>
                <span>Multi-currency account view</span>
              </p>
            </div>
          </div>
        </section>

        <section
          id="services"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
          aria-labelledby="services-title"
        >
          <div className="grid items-end gap-5 md:grid-cols-[1fr_0.8fr] md:gap-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                A considered toolkit
              </p>
              <h2
                id="services-title"
                className="mt-3 max-w-xl font-display text-3xl font-bold leading-tight text-navy sm:text-4xl"
              >
                Clarity across every account.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              The portal preview brings balances, account views and access controls into a calm,
              easy-to-follow workspace.
            </p>
          </div>

          <div className="mt-10 grid gap-7 sm:grid-cols-3 sm:gap-5">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="landing-feature landing-enter border-t border-navy/15 pt-5 sm:px-3"
                  style={{ animationDelay: `${180 + index * 120}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="size-5 text-gold" aria-hidden="true" />
                    <span className="text-xs font-medium tabular text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold text-navy">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section
          id="currencies"
          className="scroll-mt-24 border-y border-navy/10 bg-card"
          aria-labelledby="currencies-title"
        >
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                One global view
              </p>
              <h2
                id="currencies-title"
                className="mt-3 font-display text-2xl font-bold text-navy sm:text-3xl"
              >
                Four currencies.
                <br className="hidden sm:block" /> One clear overview.
              </h2>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {CURRENCIES.map((currency) => (
                <li key={currency.code} className="border-l border-gold/60 pl-3">
                  <p className="font-display text-lg font-bold text-navy">{currency.code}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{currency.name}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="security"
          className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
          aria-labelledby="security-title"
        >
          <div className="grid gap-7 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-14">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                Designed for oversight
              </p>
              <h2
                id="security-title"
                className="mt-3 font-display text-3xl font-bold leading-tight text-navy sm:text-4xl"
              >
                Every detail,
                <br className="hidden sm:block" /> in its place.
              </h2>
            </div>
            <div className="border-l border-gold/60 pl-5 sm:pl-7">
              <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Review account activity and security settings in a structured interface built to
                keep important information easy to find.
              </p>
              <Link
                to="/auth"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy transition-colors hover:text-gold"
              >
                Explore the client portal <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-navy/10 bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-7 text-center sm:flex-row sm:justify-between sm:px-6 sm:text-left lg:px-8">
          <Logo className="h-14 w-auto object-contain" />
          <p className="max-w-lg text-xs leading-5 text-muted-foreground">
            © 2026 United Bank Offshore. Portal preview only; no live accounts, funds or transfers.
          </p>
        </div>
      </footer>
    </div>
  );
}
