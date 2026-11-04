import type { CurrencyCode } from "@/lib/format";

export type TransferType =
  | "domestic_wire"
  | "swift"
  | "sepa"
  | "faster_payments"
  | "payshap"
  | "sic"
  | "internal_transfer"
  | "exchange";

export interface TransferTypeInfo {
  type: TransferType;
  label: string;
  description: string;
  baseCurrency?: CurrencyCode;
}

/**
 * Fee schedule — must mirror the fee schedule inside the
 * public.execute_transfer database function (drizzle/migrations/0001).
 */
export const TRANSFER_TYPES: TransferTypeInfo[] = [
  {
    type: "domestic_wire",
    label: "Domestic Wire",
    description: "Same-day USD wire within the domestic network",
    baseCurrency: "USD",
  },
  {
    type: "swift",
    label: "SWIFT International",
    description: "Cross-border wire to any SWIFT member bank",
  },
  {
    type: "sepa",
    label: "SEPA Transfer",
    description: "Euro credit transfer within the SEPA zone",
    baseCurrency: "EUR",
  },
  {
    type: "faster_payments",
    label: "Faster Payments",
    description: "Near-instant GBP payment within the UK",
    baseCurrency: "GBP",
  },
  {
    type: "payshap",
    label: "PayShap Instant",
    description: "Instant Rand payment via South Africa's PayShap rail",
    baseCurrency: "ZAR",
  },
  {
    type: "exchange",
    label: "Currency Exchange",
    description: "Internal conversion between your own currency wallets",
  },
  {
    type: "internal_transfer",
    label: "United Bank Transfer",
    description: "Instant transfer to another United Bank client account",
  },
];

export function transferTypeInfo(type: TransferType): TransferTypeInfo {
  return TRANSFER_TYPES.find((t) => t.type === type) ?? TRANSFER_TYPES[0]!;
}

/** Fee for a transfer — mirrors the database fee schedule exactly. */
export function feeFor(type: TransferType, amount: number): number {
  switch (type) {
    case "domestic_wire":
      return 15.0;
    case "swift":
      return 45.0;
    case "sepa":
      return 3.5;
    case "faster_payments":
      return 1.0;
    case "payshap":
      return 2.0;
    case "sic": // legacy Swiss rail — kept so historical rows still resolve
      return 2.0;
    case "exchange":
      return Math.round(amount * 0.001 * 100) / 100;
    case "internal_transfer":
      return 0;
    default:
      return 0;
  }
}

/** Exchange-rate pairs seeded in the database. */
export type RatePairs = Record<string, number>;

/**
 * Cross rate between two currencies derived from the seeded USD pairs:
 * EUR/USD, GBP/USD, USD/ZAR. Any direction is supported, including via USD.
 */
export function crossRate(from: CurrencyCode, to: CurrencyCode, rates: RatePairs): number | null {
  if (from === to) return 1;
  const usdValue = (code: CurrencyCode): number | null => {
    if (code === "USD") return 1;
    const direct = rates[`${code}/USD`];
    if (typeof direct === "number") return direct; // USD per 1 unit of code
    const inverse = rates[`USD/${code}`];
    if (typeof inverse === "number" && inverse !== 0) return 1 / inverse;
    return null;
  };
  const fromUsd = usdValue(from);
  const toUsd = usdValue(to);
  if (fromUsd == null || toUsd == null || toUsd === 0) return null;
  return fromUsd / toUsd;
}

export const DEFAULT_RATES: RatePairs = {
  "EUR/USD": 1.0845,
  "GBP/USD": 1.273,
  "USD/ZAR": 18.2,
};

/** Deterministic pseudo-random sparkline series (SSR-safe, no Math.random). */
export function seededSeries(seed: string, base: number, points = 24): number[] {
  let s = [...seed].reduce((a, c) => a + c.charCodeAt(0), 7);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + r * 0.004);
    out.push(v);
  }
  return out;
}
