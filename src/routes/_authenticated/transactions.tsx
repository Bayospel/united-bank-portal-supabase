import { useQuery } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTransactions, type Transaction } from "@/lib/banking.functions";
import { dashboardQueryOptions } from "@/routes/_authenticated/dashboard";
import { CURRENCIES, formatDateTime, formatMoney } from "@/lib/format";
import { transferTypeInfo, type TransferType } from "@/lib/fee";
import { Download, Printer, Receipt } from "lucide-react";

type Search = { account?: string | undefined; type?: string | undefined };

export const Route = createFileRoute("/_authenticated/transactions")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    account: typeof search["account"] === "string" ? search["account"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Transaction History | United Bank Offshore" },
      {
        name: "description",
        content: "Filterable statement of your transfers, payments and currency exchanges.",
      },
      { property: "og:title", content: "Transaction History | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Transactions,
});

const TRANSFER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "domestic_wire", label: "Domestic Wire" },
  { value: "swift", label: "SWIFT International" },
  { value: "sepa", label: "SEPA Transfer" },
  { value: "faster_payments", label: "Faster Payments" },
  { value: "payshap", label: "PayShap Instant" },
  { value: "exchange", label: "Currency Exchange" },
];

function Transactions() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const currencyFilter = search.account && search.account in CURRENCIES ? search.account : "all";
  const typeFilter = search.type ?? "all";
  const [direction, setDirection] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const { data: rows, isPending } = useQuery({
    queryKey: ["transactions", currencyFilter, typeFilter],
    queryFn: () =>
      getTransactions({
        data: {
          currency: currencyFilter === "all" ? undefined : currencyFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
          limit: 200,
        },
      }),
  });

  const filtered = (rows ?? []).filter((t) =>
    direction === "all" ? true : t.direction === direction,
  );
  const visible = showAll ? filtered : filtered.slice(0, 25);

  function downloadCsv() {
    const header = [
      "Date",
      "Direction",
      "Type",
      "Counterparty",
      "Reference",
      "Amount",
      "Currency",
      "Fee",
      "Status",
    ];
    const lines = filtered.map((t) =>
      [
        formatDateTime(t.created_at),
        t.direction,
        t.type,
        t.counterparty_name ?? "",
        t.reference ?? "",
        String(t.amount),
        t.currency,
        String(t.fee),
        t.status,
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `united-bank-offshore-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Statement downloaded");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
            Transaction History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your full statement of transfers, payments and currency exchanges.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadCsv}>
            <Download className="h-4 w-4" /> Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              window.print();
            }}
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </header>

      {/* Filters */}
      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3 print:hidden">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Account</p>
          <Select
            value={currencyFilter}
            onValueChange={(v) =>
              navigate({
                to: "/transactions",
                search: {
                  account: v === "all" ? undefined : v,
                  type: typeFilter === "all" ? undefined : typeFilter,
                },
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {(Object.keys(CURRENCIES) as (keyof typeof CURRENCIES)[]).map((code) => (
                <SelectItem key={code} value={code}>
                  {CURRENCIES[code].flag} {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Transfer type</p>
          <Select
            value={typeFilter}
            onValueChange={(v) =>
              navigate({
                to: "/transactions",
                search: {
                  account: currencyFilter === "all" ? undefined : currencyFilter,
                  type: v === "all" ? undefined : v,
                },
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TRANSFER_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Direction</p>
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All directions</SelectItem>
              <SelectItem value="debit">Debits (money out)</SelectItem>
              <SelectItem value="credit">Credits (money in)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Statement */}
      <section className="overflow-hidden rounded-2xl border bg-card print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-navy">
            Statement · {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </h2>
          <span className="text-xs text-muted-foreground">United Bank Offshore</span>
        </div>
        {isPending ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            <Receipt className="mx-auto mb-2 h-8 w-8 opacity-40" />
            No transactions match these filters yet.
          </p>
        ) : (
          <ul className="divide-y">
            {visible.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </ul>
        )}
        {!showAll && filtered.length > visible.length && (
          <div className="border-t px-5 py-3 text-center print:hidden">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
              Show all {filtered.length} entries
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function typeLabel(type: string): string {
  return transferTypeInfo(type as TransferType)?.label ?? type;
}

function TransactionRow({ t }: { t: Transaction }) {
  const credit = t.direction === "credit";
  return (
    <li className="px-4 sm:px-5">
      <Dialog>
        <div className="flex items-center justify-between gap-3 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                credit ? "bg-success/10 text-success" : "bg-muted text-navy"
              }`}
            >
              <Receipt className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {t.counterparty_name ?? typeLabel(t.type)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {formatDateTime(t.created_at)} · {typeLabel(t.type)}
                {t.reference ? ` · ${t.reference}` : ""}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="text-right">
              <p
                className={`tabular text-sm font-semibold ${
                  credit ? "text-success" : "text-navy"
                }`}
              >
                {credit ? "+" : "−"}
                {formatMoney(Number(t.amount), t.currency)}
              </p>
              <Badge
                variant="outline"
                className="mt-0.5 px-1.5 py-0 text-[10px] uppercase text-muted-foreground"
              >
                {t.status}
              </Badge>
            </div>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Details
              </Button>
            </DialogTrigger>
          </div>
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-navy">
              {t.counterparty_name ?? typeLabel(t.type)}
            </DialogTitle>
            <DialogDescription>
              {formatDateTime(t.created_at)} · United Bank Offshore
            </DialogDescription>
          </DialogHeader>
          <dl className="divide-y rounded-xl border bg-muted/40 p-4 text-sm">
            <DetailRow label="Type" value={typeLabel(t.type)} />
            <DetailRow label="Direction" value={credit ? "Credit (in)" : "Debit (out)"} />
            <DetailRow label="Amount" value={formatMoney(Number(t.amount), t.currency)} strong />
            {t.target_amount != null && t.target_currency && (
              <DetailRow
                label="Received"
                value={`${formatMoney(Number(t.target_amount), t.target_currency)} @ ${Number(t.fx_rate).toFixed(4)}`}
              />
            )}
            <DetailRow label="Fee" value={formatMoney(Number(t.fee), t.currency)} />
            <DetailRow label="Counterparty" value={t.counterparty_name ?? "—"} />
            <DetailRow label="Destination" value={t.counterparty_details ?? "—"} />
            <DetailRow label="Reference" value={t.reference ?? "—"} />
            {t.description && <DetailRow label="Description" value={t.description} />}
            <DetailRow label="Status" value={t.status} />
          </dl>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function DetailRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`max-w-[65%] break-words text-right ${strong ? "font-display font-bold text-navy" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
