import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Copy, FileText, Globe, Hash, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { dashboardQueryOptions } from "@/routes/_authenticated/dashboard";
import { accountLabel, formatMoney, type CurrencyCode } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({
    meta: [
      { title: "My Accounts | United Bank Offshore" },
      { name: "description", content: "Your USD, EUR, GBP and ZAR multi-currency wallets." },
      { property: "og:title", content: "My Accounts | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Accounts,
});

const ACTION_TYPES: Record<string, string> = {
  USD: "domestic_wire",
  EUR: "sepa",
  GBP: "faster_payments",
  ZAR: "payshap",
};

const ACTION_LABELS: Record<string, string> = {
  USD: "Send Wire",
  EUR: "SEPA Transfer",
  GBP: "Faster Payments",
  ZAR: "PayShap",
};

function Accounts() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">My Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Four currency wallets with dedicated account details, ready to send and receive.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {data.accounts.map((a) => (
          <section key={a.id} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {a.currency === "USD" ? "🇺🇸" : a.currency === "EUR" ? "🇪🇺" : a.currency === "GBP" ? "🇬🇧" : "🇿🇦"}
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-navy">
                    {a.currency} Account
                  </h2>
                  <p className="text-xs text-muted-foreground">{a.nickname ?? `${a.currency} Wallet`}</p>
                </div>
              </div>
              <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-success">
                {a.status}
              </span>
            </div>

            <p className="tabular mt-5 font-display text-3xl font-bold text-navy">
              {formatMoney(Number(a.balance), a.currency as CurrencyCode)}
            </p>

            <dl className="mt-4 space-y-2.5 rounded-xl bg-muted/60 p-4 text-sm">
              <Row
                icon={<Hash className="h-3.5 w-3.5 text-gold" />}
                label="Account Number"
                value={a.account_number ?? a.iban}
              />
              <Row
                icon={<Building2 className="h-3.5 w-3.5 text-gold" />}
                label="Routing / Sort Code"
                value={a.routing_number ?? a.sort_code ?? "021000021"}
              />
              <Row
                icon={<Globe className="h-3.5 w-3.5 text-gold" />}
                label="SWIFT / BIC Code"
                value={a.bic ?? "UBOFUS33XXX"}
              />
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/transactions" search={{ account: a.currency, type: undefined }}>
                  <FileText className="h-4 w-4" /> View Statement
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-navy text-white hover:bg-navy/90">
                <Link to="/transfers" search={{ from: a.currency, type: ACTION_TYPES[a.currency] }}>
                  <Send className="h-4 w-4" /> {ACTION_LABELS[a.currency]}
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  const displayVal = value && value.trim() !== "" ? value : "—";

  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="flex min-w-0 items-center gap-1.5 tabular text-sm font-medium font-mono">
        <span className="truncate text-navy font-semibold">{displayVal}</span>
        {displayVal !== "—" && (
          <button
            onClick={() => {
              void navigator.clipboard.writeText(displayVal);
              toast.success("Copied to clipboard");
            }}
            className="shrink-0 text-muted-foreground hover:text-navy"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </dd>
    </div>
  );
}
