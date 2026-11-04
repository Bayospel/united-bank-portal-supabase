import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, FileCheck2, Landmark, Loader2, MessageSquare, MinusCircle, PlusCircle, RefreshCw, Send, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console | United Bank Offshore" },
      { name: "description", content: "United Bank Offshore administrator console." },
    ],
  }),
  component: AdminPage,
});

export interface AdminCustomerAccount {
  id: string;
  currency: string;
  balance: number;
  account_number: string | null;
  iban: string | null;
  status: string;
}

export interface AdminCustomer {
  id: string;
  display_name: string | null;
  email: string | null;
  residential_address: string | null;
  employment_details: string | null;
  date_of_birth: string | null;
  government_id_status: string;
  government_id_path: string | null;
  created_at: string;
  accounts: AdminCustomerAccount[];
}

export interface SupportMessage {
  id: string;
  user_id: string;
  sender_type: "customer" | "admin";
  message: string;
  created_at: string;
}

function AdminPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{
    customer: AdminCustomer;
    account: AdminCustomerAccount;
    mode: "credit" | "debit";
  } | null>(null);
  
  const [activeChatCustomer, setActiveChatCustomer] = useState<AdminCustomer | null>(null);
  const [replyText, setReplyText] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const { data: customers = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-customers-client"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_customers");
      if (error) throw new Error(error.message);
      return (data ?? []) as AdminCustomer[];
    },
  });

  const { data: chatMessages = [], refetch: refetchChat } = useQuery({
    queryKey: ["admin-chat", activeChatCustomer?.id],
    enabled: !!activeChatCustomer,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", activeChatCustomer!.id)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as SupportMessage[];
    },
  });

  useEffect(() => {
    if (!activeChatCustomer) return;
    const channel = supabase
      .channel(`support-${activeChatCustomer.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${activeChatCustomer.id}` },
        () => {
          refetchChat();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatCustomer, refetchChat]);

  const sendReply = useMutation({
    mutationFn: async () => {
      if (!activeChatCustomer || !replyText.trim()) return;
      const { error } = await supabase.from("support_messages").insert({
        user_id: activeChatCustomer.id,
        sender_type: "admin",
        message: replyText.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setReplyText("");
      refetchChat();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const adjustBalance = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Select an account first");
      const rpcName = selected.mode === "credit" ? "admin_credit_account" : "admin_debit_account";
      const { data, error } = await supabase.rpc(rpcName, {
        _account_id: selected.account.id,
        _amount: Number(amount),
        _note: note,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(
        selected?.mode === "credit"
          ? "Customer balance credited successfully"
          : "Customer balance debited successfully"
      );
      setAmount("");
      setNote("");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-customers-client"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 font-display text-xl font-bold text-navy">Unable to load Admin Console</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

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
              Review customer accounts, verification details, add or deduct balances, and chat live with customers.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-2 text-xs font-semibold text-gold">
            <ShieldCheck className="h-4 w-4" /> Admin access
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.6fr)]">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">Customer accounts</h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading customers..." : `${customers.length} customer(s) registered`}
              </p>
            </div>
            <UserRound className="h-5 w-5 text-gold" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center rounded-2xl border bg-card p-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading customer records...
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
              No customer accounts found.
            </div>
          ) : (
            customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onSelect={(account, mode) => setSelected({ customer, account, mode })}
                onOpenChat={() => setActiveChatCustomer(customer)}
              />
            ))
          )}
        </section>

        <aside className="h-fit space-y-6 lg:sticky lg:top-24">
          {/* Balance Adjustment Panel */}
          {selected && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-semibold text-navy">
                  {selected.mode === "credit" ? "Credit Customer Balance" : "Debit Customer Balance"}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {selected.customer.display_name ?? "Customer"} · {selected.account.currency} account
              </p>
              <div className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="adjAmount">Amount ({selected.account.currency})</Label>
                  <Input
                    id="adjAmount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adjNote">Reason / Audit Note</Label>
                  <Textarea
                    id="adjNote"
                    rows={3}
                    placeholder={
                      selected.mode === "credit"
                        ? "Approved opening balance adjustment"
                        : "Administrative debit adjustment"
                    }
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Cancel
                  </Button>
                  <Button
                    className={`flex-1 font-semibold text-white ${
                      selected.mode === "credit"
                        ? "bg-gold text-navy hover:bg-gold/90"
                        : "bg-destructive hover:bg-destructive/90"
                    }`}
                    disabled={adjustBalance.isPending || Number(amount) <= 0 || note.trim().length < 3}
                    onClick={() => adjustBalance.mutate()}
                  >
                    {adjustBalance.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selected.mode === "credit" ? "Credit Balance (+)" : "Debit Balance (-)"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Live Support Chat Panel */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-semibold text-navy">Customer Support Chat</h2>
              </div>
              {activeChatCustomer && (
                <Button variant="ghost" size="sm" onClick={() => setActiveChatCustomer(null)}>
                  Close
                </Button>
              )}
            </div>

            {activeChatCustomer ? (
              <div className="mt-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground">
                  Chatting with: <span className="text-navy">{activeChatCustomer.display_name ?? activeChatCustomer.email}</span>
                </p>
                <div className="h-64 space-y-3 overflow-y-auto rounded-xl border bg-surface p-3 text-xs">
                  {chatMessages.length === 0 ? (
                    <p className="py-20 text-center text-muted-foreground">No messages yet from this customer.</p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender_type === "admin" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3 py-2 ${
                            msg.sender_type === "admin" ? "bg-navy text-white" : "bg-muted text-foreground"
                          }`}
                        >
                          <p>{msg.message}</p>
                        </div>
                        <span className="mt-1 text-[10px] text-muted-foreground">
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply.mutate()}
                  />
                  <Button className="bg-gold text-navy hover:bg-gold/90" onClick={() => sendReply.mutate()} disabled={sendReply.isPending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Click <span className="font-semibold text-navy">"Open Chat"</span> on any customer card to review and reply to their support messages.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function CustomerCard({
  customer,
  onSelect,
  onOpenChat,
}: {
  customer: AdminCustomer;
  onSelect: (account: AdminCustomerAccount, mode: "credit" | "debit") => void;
  onOpenChat: () => void;
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold" onClick={onOpenChat}>
            <MessageSquare className="h-3.5 w-3.5 text-gold" /> Open Chat
          </Button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-1 text-xs font-semibold text-navy">
            <FileCheck2 className="h-3.5 w-3.5" /> {(customer.government_id_status ?? "pending").replace("_", " ")}
          </span>
        </div>
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
        {(customer.accounts ?? []).map((account) => (
          <div key={account.id} className="rounded-xl border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-navy">{account.currency}</p>
              <span className="text-[10px] text-muted-foreground">{account.status}</span>
            </div>
            <p className="mt-1 tabular text-lg font-bold text-navy">
              {formatMoney(Number(account.balance), account.currency as any)}
            </p>
            <p className="mt-1 truncate text-[10px] text-muted-foreground">
              {account.account_number ?? account.iban ?? "No account identifier"}
            </p>
            <div className="mt-3 flex gap-1.5">
              <Button
                size="sm"
                className="flex-1 bg-navy text-white hover:bg-navy/90 text-xs px-2"
                onClick={() => onSelect(account, "credit")}
              >
                <PlusCircle className="mr-1 h-3.5 w-3.5" /> Credit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs px-2"
                onClick={() => onSelect(account, "debit")}
              >
                <MinusCircle className="mr-1 h-3.5 w-3.5" /> Debit
              </Button>
            </div>
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
