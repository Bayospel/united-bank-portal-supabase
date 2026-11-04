import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { executeTransferFn } from "@/lib/banking.functions";
import { dashboardQueryOptions } from "@/routes/_authenticated/dashboard";
import type { Account } from "@/lib/banking.functions";
import { formatDateTime, formatMoney, type CurrencyCode } from "@/lib/format";
import { crossRate, feeFor, transferTypeInfo, type TransferType } from "@/lib/fee";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Search = { from?: string | undefined; type?: string | undefined };

export const Route = createFileRoute("/_authenticated/transfers")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    from: typeof search["from"] === "string" ? search["from"] : undefined,
    type: typeof search["type"] === "string" ? search["type"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Transfers & Payments | United Bank Offshore" },
      {
        name: "description",
        content: "Domestic wires, SWIFT, SEPA, Faster Payments, PayShap and FX.",
      },
      { property: "og:title", content: "Transfers & Payments | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Transfers,
});

function Transfers() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<TransferType>((search.type as TransferType) ?? "domestic_wire");
  const [fromCurrency, setFromCurrency] = useState<string>(search.from ?? "USD");
  const [toCurrency, setToCurrency] = useState<string>("EUR");
  const [amount, setAmount] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [counterpartyDetails, setCounterpartyDetails] = useState("");
  const [reference, setReference] = useState("");
  const [confirmation, setConfirmation] = useState<{ id: string } | null>(null);

  const accounts = data.accounts;
  const rateMap: Record<string, number> = {};
  for (const r of data.rates) rateMap[r.pair] = Number(r.rate);

  const from = accounts.find((a) => a.currency === fromCurrency);
  const to = accounts.find((a) => a.currency === toCurrency);
  const amt = Number(amount) || 0;
  const fee = feeFor(type, amt);
  const isExchange = type === "exchange";
  const isInternal = type === "internal_transfer";
  const rate = isExchange && from && to ? crossRate(from.currency, to.currency, rateMap) : null;
  const targetAmount = rate ? Math.round(amt * rate * 100) / 100 : null;
  const info = transferTypeInfo(type);

  const submit = useMutation({
    mutationFn: async () => {
      return executeTransferFn({
        data: {
          sourceAccountId: from!.id,
          type,
          amount: amt,
          counterpartyName: isExchange ? "" : counterpartyName,
          counterpartyDetails: isExchange ? "" : counterpartyDetails,
          reference,
          ...(isExchange && to ? { targetAccountId: to.id } : {}),
          ...(isInternal ? { targetAccountIdentifier: counterpartyDetails } : {}),
        },
      });
    },
    onSuccess: (res) => {
      setConfirmation(res);
      setStep(4);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shell"] });
    },
    onError: (e) => toast.error(e.message),
  });

  function reset() {
    setStep(1);
    setAmount("");
    setCounterpartyName("");
    setCounterpartyDetails("");
    setReference("");
    setConfirmation(null);
  }

  const canContinue =
    amt > 0 &&
    from != null &&
    (!isExchange || (to != null && from.currency !== to?.currency)) &&
    (isExchange || (counterpartyName.trim().length > 1 && counterpartyDetails.trim().length > 1)) &&
    amt + fee <= Number(from?.balance ?? 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Transfers & Payments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Domestic wires, SWIFT international, SEPA, Faster Payments, PayShap and internal FX.
        </p>
      </header>

      {/* Steps indicator */}
      <ol className="flex items-center gap-2 text-xs font-semibold">
        {["Method", "Details", "Review", "Done"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                step > i
                  ? "bg-gold text-navy"
                  : step === i + 1
                    ? "bg-navy text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === i + 1 ? "text-navy" : "text-muted-foreground"}>{label}</span>
            {i < 3 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Choose a transfer method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["internal_transfer", "United Bank Transfer"],
              ["domestic_wire", "Domestic Wire"],
              ["swift", "SWIFT International"],
              ["sepa", "SEPA Transfer"],
              ["faster_payments", "Faster Payments"],
              ["payshap", "PayShap Instant"],
              ["exchange", "Currency Exchange"],
            ].map(([t, label]) => (
              <button
                key={t}
                onClick={() => {
                  setType(t as TransferType);
                  const info = transferTypeInfo(t as TransferType);
                  if (info.baseCurrency) setFromCurrency(info.baseCurrency);
                }}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  type === t ? "border-gold bg-gold-soft/50" : "hover:bg-accent"
                }`}
              >
                <p className="text-sm font-semibold text-navy">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {transferTypeInfo(t as TransferType).description}
                </p>
                <p className="mt-2 text-xs font-semibold text-gold">
                  Fee:{" "}
                  {(t as TransferType) === "exchange"
                    ? "0.1% of amount"
                    : `$${feeFor(t as TransferType, 0).toFixed(2)}`}
                </p>
              </button>
            ))}
          </div>
          <Button className="mt-5 bg-navy text-white hover:bg-navy/90" onClick={() => setStep(2)}>
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy">{info.label} details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>From account</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.currency}>
                      {a.currency} — {formatMoney(Number(a.balance), a.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {isExchange && (
              <div className="space-y-1.5">
                <Label>To account</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts
                      .filter((a) => a.currency !== fromCurrency)
                      .map((a) => (
                        <SelectItem key={a.id} value={a.currency}>
                          {a.currency} — {formatMoney(Number(a.balance), a.currency)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ({fromCurrency})</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {!isExchange && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="cpName">
                    {isInternal ? "Recipient name" : "Beneficiary name"}
                  </Label>
                  <Input
                    id="cpName"
                    placeholder={isInternal ? "Account holder name" : "Acme Holdings Ltd"}
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="cpDetails">
                    {isInternal
                      ? "United Bank account number or IBAN"
                      : type === "swift"
                        ? "SWIFT/BIC & account number"
                        : type === "domestic_wire"
                          ? "Account & routing number"
                          : type === "sepa"
                            ? "IBAN"
                            : type === "faster_payments"
                              ? "Sort code & account number"
                              : "IBAN / account number"}
                  </Label>
                  <Input
                    id="cpDetails"
                    placeholder={
                      isInternal
                        ? "Recipient's account number or IBAN"
                        : "Destination account details"
                    }
                    value={counterpartyDetails}
                    onChange={(e) => setCounterpartyDetails(e.target.value)}
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ref">Reference</Label>
              <Input
                id="ref"
                placeholder="INV-2026-001"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>
          {rate && (
            <p className="mt-3 rounded-lg bg-gold-soft/60 px-3 py-2 text-xs font-medium text-navy">
              Live rate: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </p>
          )}
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              className="bg-navy text-white hover:bg-navy/90"
              disabled={!canContinue}
              onClick={() => setStep(3)}
            >
              Review transfer <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          {from && amt > 0 && amt + fee > Number(from.balance) && (
            <p className="mt-2 text-xs text-destructive">Insufficient funds including fee.</p>
          )}
        </section>
      )}

      {step === 3 && from && (
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-navy">Review & confirm</h2>
          <dl className="mt-4 divide-y text-sm">
            <RowLine label="Method" value={info.label} />
            <RowLine label="From" value={`${from.currency} account`} />
            {isExchange && <RowLine label="To" value={`${to?.currency} account`} />}
            <RowLine label="Amount" value={formatMoney(amt, from.currency)} />
            {isExchange && rate && (
              <>
                <RowLine
                  label="Exchange rate"
                  value={`1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`}
                />
                <RowLine
                  label="You receive"
                  value={formatMoney(targetAmount ?? 0, to?.currency ?? "USD")}
                />
              </>
            )}
            {!isExchange && (
              <RowLine label={isInternal ? "Recipient" : "Beneficiary"} value={counterpartyName} />
            )}
            {!isExchange && <RowLine label="Destination" value={counterpartyDetails} />}
            {reference && <RowLine label="Reference" value={reference} />}
            <RowLine label="Fee" value={formatMoney(fee, from.currency)} />
            <RowLine label="Total debit" value={formatMoney(amt + fee, from.currency)} strong />
          </dl>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              className="bg-gold font-semibold text-navy hover:bg-gold/90"
              disabled={submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authorize transfer
            </Button>
          </div>
        </section>
      )}

      {step === 4 && confirmation && (
        <section className="rounded-2xl border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-4 font-display text-xl font-bold text-navy">Transfer authorized</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reference {reference || confirmation.id.slice(0, 8)} ·{" "}
            {formatMoney(amt + fee, fromCurrency)}
            {isExchange && targetAmount
              ? ` → ${formatMoney(targetAmount, to?.currency ?? "USD")}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(new Date())} — a confirmation has been added to your transaction
            history.
          </p>
          <Button className="mt-6 bg-navy text-white hover:bg-navy/90" onClick={reset}>
            New transfer
          </Button>
        </section>
      )}

      {/* Recent transfers */}
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-display text-lg font-semibold text-navy">Recent transfers</h2>
        <ul className="mt-3 divide-y">
          {data.transactions.slice(0, 6).map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.counterparty_name ?? t.type}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
              </div>
              <p className="tabular shrink-0 text-sm font-semibold">
                −{formatMoney(Number(t.amount), t.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function RowLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`tabular max-w-[60%] truncate text-right ${strong ? "font-display font-bold text-navy" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}
