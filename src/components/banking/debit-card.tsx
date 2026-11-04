import { CreditCard, Wifi } from "lucide-react";

import type { Account } from "@/lib/banking.functions";
import { maskNumber } from "@/lib/format";

export function DebitCard({ holderName, account }: { holderName: string; account?: Account }) {
  const accountNumber = account?.account_number ?? account?.iban ?? "0000 0000 0000 0000";
  const lastFour = accountNumber.replace(/\D/g, "").slice(-4).padStart(4, "0");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-navy p-5 text-white shadow-lg sm:p-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border border-gold/25" />
      <div className="pointer-events-none absolute -right-4 -top-8 h-32 w-32 rounded-full border border-gold/20" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
            United Bank
          </p>
          <p className="mt-1 text-xs text-white/55">Offshore debit</p>
        </div>
        <CreditCard className="h-7 w-7 text-gold" />
      </div>
      <div className="relative mt-8 flex items-center gap-3">
        <span className="h-7 w-9 rounded-md border border-gold/50 bg-gold/30" />
        <Wifi className="h-5 w-5 rotate-90 text-white/75" />
      </div>
      <p className="relative mt-4 font-mono text-lg tracking-[0.2em] text-white/90">
        •••• •••• •••• {lastFour}
      </p>
      <div className="relative mt-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">Cardholder</p>
          <p className="mt-1 truncate text-sm font-semibold uppercase tracking-wide">
            {holderName || "Account holder"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">Currency</p>
          <p className="mt-1 text-sm font-semibold text-gold">{account?.currency ?? "USD"}</p>
        </div>
      </div>
    </section>
  );
}
