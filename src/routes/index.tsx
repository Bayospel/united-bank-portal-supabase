import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Landmark, Lock, Wallet } from "lucide-react";

import { Logo } from "@/components/banking/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "United Bank Offshore | Private & Corporate Banking",
        description:
          "Multi-currency offshore accounts, SWIFT & SEPA transfers, and bank-grade security. Global banking. Borderless opportunities.",
      },
      { property: "og:title", content: "United Bank Offshore | Private & Corporate Banking" },
      {
        property: "og:description",
        content: "Multi-currency offshore accounts, SWIFT & SEPA transfers, bank-grade security.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Wallet,
    title: "Multi-Currency Wallets",
    text: "Hold USD, EUR, GBP and ZAR side by side with dedicated IBANs, sort codes and South African accounts.",
  },
  {
    icon: Globe2,
    title: "Global Payment Rails",
    text: "Domestic wires, SWIFT international, SEPA, UK Faster Payments and PayShap — one platform.",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    text: "Two-factor authentication, device management, encrypted sessions and a full audit trail.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(60% 80% at 80% 10%, oklch(0.73 0.095 85 / 0.35), transparent), radial-gradient(50% 60% at 10% 90%, oklch(0.4 0.08 262 / 0.8), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <header className="flex items-center justify-between">
            <div className="rounded-xl bg-white px-4 py-2.5">
              <Logo className="h-10 w-auto" />
            </div>
            <Button asChild variant="ghost" className="text-gold hover:bg-white/10 hover:text-gold">
              <Link to="/auth">Client Login</Link>
            </Button>
          </header>

          <div className="mx-auto max-w-3xl py-16 text-center sm:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold">
              Est. Private & Corporate Banking
            </p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Global banking.
              <br />
              <span className="text-gold">Borderless opportunities.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-white/70 sm:text-base">
              Manage four currencies from one encrypted console — USD, EUR, GBP and ZAR — with
              worldwide wire rails, live FX and 24/7 compliance monitoring.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-gold font-semibold text-navy hover:bg-gold/90">
                <Link to="/auth">
                  Access your accounts <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/auth">Open an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Why United Bank Offshore
          </p>
          <h2 className="mt-3 font-display text-2xl font-bold text-navy sm:text-3xl">
            One console for your entire balance sheet
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-navy">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Currencies strip */}
        <div className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-soft text-navy">
                <Landmark className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-navy">
                Four core currencies · Dedicated account details · Real-time FX
              </p>
            </div>
            <div className="flex items-center gap-3 text-2xl">
              <span title="US Dollar">🇺🇸</span>
              <span title="Euro">🇪🇺</span>
              <span title="British Pound">🇬🇧</span>
              <span title="South African Rand">🇿🇦</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-card py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 sm:flex-row sm:justify-between sm:px-6">
          <Logo className="h-9 w-auto" />
          <p className="text-xs text-muted-foreground">
            © 2026 United Bank Offshore. Demo environment — no real funds are held or moved.
          </p>
        </div>
      </footer>
    </div>
  );
}
