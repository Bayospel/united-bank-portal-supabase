import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Eye,
  FileText,
  Send,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Smartphone,
} from "lucide-react";

import { getDashboardData, type Account } from "@/lib/banking.functions";
import {
  accountLabel,
  formatCompactMoney,
  formatDateTime,
  formatMoney,
  greeting,
  maskNumber,
  type CurrencyCode,
} from "@/lib/format";
import { crossRate, seededSeries } from "@/lib/fee";

export const dashboardQueryOptions = {
  queryKey: ["dashboard"] as const,
  queryFn: () => getDashboardData(),
};

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | United Bank Offshore" },
      { name: "description", content: "Your consolidated multi-currency offshore overview." },
      { property: "og:title", content: "Dashboard | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Dashboard,
});

const ACTION_LABELS: Record<string, string> = {
  USD: "Send Wire",
  EUR: "SEPA Transfer",
  GBP: "Faster Payments",
  ZAR: "PayShap",
};

const ACTION_TYPES: Record<string, string> = {
  USD: "domestic_wire",
  EUR: "sepa",
  GBP: "faster_payments",
  ZAR: "payshap",
};

function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const { profile, accounts, transactions, rates, events, devices } = data;

  const rateMap: Record<string, number> = {};
  for (const r of rates) rateMap[r.pair] = Number(r.rate);

  const totalUsd = accounts.reduce((sum, a) => {
    const rate = crossRate(a.currency, "USD", rateMap) ?? 1;
    return sum + Number(a.balance) * rate;
  }, 0);

  const twoFactorOn = profile.two_factor_enabled;
  const lastEvent = events[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Welcome header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-navy sm:text-3xl">
            {greeting(profile.display_name ?? "Client")}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Last login: {formatDateTime(profile.last_login_at)} ·{" "}
            <span className="font-medium text-navy">
              {profile.two_factor_enabled ? "2FA active session" : "2FA inactive"}
            </span>
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
            twoFactorOn
              ? "border-gold/40 bg-gold-soft text-navy"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {twoFactorOn ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {twoFactorOn ? "Session secured" : "Enable 2FA"}
        </span>
      </header>

      {/* Net worth */}
      <section className="overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          Consolidated net worth
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tabular font-display text-4xl font-bold sm:text-5xl">
              {formatMoney(totalUsd, "USD")}
            </p>
            <p className="mt-1 text-xs text-white/60">Estimated value · USD equivalent</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {accounts.map((a) => {
              const rate = crossRate(a.currency, "USD", rateMap) ?? 1;
              const value = Number(a.balance) * rate;
              const pct = totalUsd > 0 ? Math.round((value / totalUsd) * 100) : 0;
              return (
                <div key={a.id} className="min-w-[110px] rounded-xl bg-white/5 px-3 py-2">
                  <p className="text-xs text-white/60">
                    {a.currency} · {pct}%
                  </p>
                  <p className="tabular text-sm font-semibold text-gold">
                    {formatCompactMoney(value, "USD")}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Wallet cards */}
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {accounts.map((a) => (
              <WalletCard key={a.id} account={a} rateMap={rateMap} />
            ))}
          </div>

          {/* Recent transactions */}
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-navy">Recent activity</h2>
              <Link
                to="/transactions"
                className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
              >
                View all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-3 divide-y">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {t.counterparty_name ?? t.type}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(t.created_at)} · {t.reference ?? t.type}
                    </p>
                  </div>
                  <p className="tabular shrink-0 text-sm font-semibold">
                    −{formatMoney(Number(t.amount), t.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sidebar modules */}
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-navy">Global market watch</h2>
            <ul className="mt-3 space-y-4">
              {rates.map((r) => {
                const series = seededSeries(r.pair, Number(r.rate));
                const min = Math.min(...series);
                const max = Math.max(...series);
                const pts = series
                  .map((v, i) => `${(i / (series.length - 1)) * 100},${28 - ((v - min) / (max - min || 1)) * 24}`)
                  .join(" ");
                const up = Number(r.change_24h) >= 0;
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{r.pair}</p>
                      <p className={`text-xs ${up ? "text-success" : "text-destructive"}`}>
                        {up ? "▲" : "▼"} {Math.abs(Number(r.change_24h)) * 100}%
                      </p>
                    </div>
                    <svg viewBox="0 0 100 30" className="h-8 w-24">
                      <polyline points={pts} fill="none" stroke="currentColor" className={up ? "text-success" : "text-destructive"} strokeWidth="2" />
                    </svg>
                    <p className="tabular text-sm font-medium">{Number(r.rate).toFixed(4)}</p>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-display text-lg font-semibold text-navy">Security & audit</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                {twoFactorOn ? (
                  <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span>Two-factor authentication {twoFactorOn ? "active" : "disabled"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 shrink-0 text-gold" />
                <span>
                  {devices.length} recognized device{devices.length === 1 ? "" : "s"}
                </span>
              </div>
              {lastEvent && (
                <p className="text-xs text-muted-foreground">
                  Last event: {lastEvent.event_type} · {formatDateTime(lastEvent.created_at)}
                </p>
              )}
              <Link
                to="/security"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
              >
                Manage security <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WalletCard({ account, rateMap }: { account: Account; rateMap: Record<string, number> }) {
  const usd = Number(account.balance) * (crossRate(account.currency, "USD", rateMap) ?? 1);
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{account.currency === "USD" ? "🇺🇸" : account.currency === "EUR" ? "🇪🇺" : account.currency === "GBP" ? "🇬🇧" : "🇿🇦"}</span>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-navy">{account.currency} Account</p>
            <p className="truncate text-xs text-muted-foreground">{account.nickname}</p>
          </div>
        </div>
        <span className="tabular shrink-0 rounded-lg bg-gold-soft px-2 py-1 text-[11px] font-semibold text-navy">
          ≈ {formatCompactMoney(usd, "USD")}
        </span>
      </div>
      <p className="tabular mt-4 font-display text-2xl font-bold text-navy">
        {formatMoney(Number(account.balance), account.currency)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {accountLabel(account)} ·{" "}
        {maskNumber(
          account.currency === "EUR" ? account.iban : account.account_number,
        )}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          to="/transactions"
          search={{ account: account.currency, type: undefined }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-accent"
        >
          <FileText className="h-3.5 w-3.5" /> View Statement
        </Link>
        <Link
          to="/transfers"
          search={{ from: account.currency, type: ACTION_TYPES[account.currency] }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-navy/90"
        >
          <Send className="h-3.5 w-3.5" /> {ACTION_LABELS[account.currency]}
        </Link>
      </div>
    </div>
  );
}
