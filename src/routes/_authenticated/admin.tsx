import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, FileCheck2, Landmark, Loader2, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  adminCreditAccountFn,
  getAdminCustomersFn,
  type AdminCustomer,
  type AdminCustomerAccount,
} from "@/lib/banking.functions";
import { formatDateTime, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | United Bank Offshore" },
      { name: "description", content: "United Bank Offshore administrator console." },
    ],
  }),
  loader: () => getAdminCustomersFn(),
  component: AdminPage,
});

function AdminPage() {
  const customers = useSuspenseQuery({
    queryKey: ["admin-customers"],
    queryFn: () => getAdminCustomersFn(),
  }).data;
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{
    customer: AdminCustomer;
    account: AdminCustomerAccount;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const credit = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Select a customer account first");
      return adminCreditAccountFn({
        data: { accountId: selected.account.id, amount: Number(amount), note },
      });
    },
    onSuccess: () => {
      toast.success("Customer balance credited");
      setAmount("");
      setNote("");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              Restricted workspace
            </p>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              United Bank Admin Console
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Review newly created customer accounts, verification details, and balances. Every
              balance credit requires a note and creates an audit record.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-2 text-xs font-semibold text-gold">
            <ShieldCheck className="h-4 w-4" /> Admin access
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">Customer accounts</h2>
              <p className="text-sm text-muted-foreground">
                {customers.length} customer{customers.length === 1 ? "" : "s"} registered
              </p>
            </div>
            <UserRound className="h-5 w-5 text-gold" />
          </div>
          {customers.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No customer accounts found.
            </div>
          ) : (
            customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onCredit={(account) => setSelected({ customer, account })}
              />
            ))
          )}
        </section>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-24">
          {selected ? (
            <>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-semibold text-navy">Add customer funds</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {selected.customer.display_name} · {selected.account.currency} account
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="creditAmount">Amount ({selected.account.currency})</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="creditNote">Reason / audit note</Label>
                  <Textarea
                    id="creditNote"
                    rows={4}
                    placeholder="Approved opening balance adjustment"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gold font-semibold text-navy hover:bg-gold/90"
                    disabled={credit.isPending || Number(amount) <= 0 || note.trim().length < 3}
                    onClick={() => credit.mutate()}
                  >
                    {credit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Credit
                    balance
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <Landmark className="mx-auto h-8 w-8 text-gold" />
              <h2 className="mt-3 font-display text-lg font-semibold text-navy">
                Select an account
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a customer account to open the audited balance-credit form.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  onCredit,
}: {
  customer: AdminCustomer;
  onCredit: (account: AdminCustomerAccount) => void;
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-navy">
            {customer.display_name ?? "Unnamed customer"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {customer.email ?? "No email"} · Created {formatDateTime(customer.created_at)}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-1 text-xs font-semibold text-navy">
          <FileCheck2 className="h-3.5 w-3.5" /> {customer.government_id_status.replace("_", " ")}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <Info label="Date of birth" value={customer.date_of_birth ?? "Not supplied"} />
        <Info label="Employment" value={customer.employment_details ?? "Not supplied"} />
        <Info label="Residential address" value={customer.residential_address ?? "Not supplied"} />
        <Info
          label="Government ID"
          value={customer.government_id_path ? "Document submitted" : "Verification requested"}
        />
      </dl>
      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {customer.accounts.map((account) => (
          <div key={account.id} className="rounded-xl border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-navy">{account.currency}</p>
              <span className="text-[10px] text-muted-foreground">{account.status}</span>
            </div>
            <p className="mt-1 tabular text-lg font-bold text-navy">
              {formatMoney(Number(account.balance), account.currency)}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {account.account_number ?? account.iban ?? "No account identifier"}
            </p>
            <Button
              size="sm"
              className="mt-3 w-full bg-navy text-white hover:bg-navy/90"
              onClick={() => onCredit(account)}
            >
              Add money
            </Button>
          </div>
        ))}
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-foreground">{value}</dd>
    </div>
  );
}
