export type CurrencyCode = "USD" | "EUR" | "GBP" | "ZAR";

export const CURRENCIES: Record<
  CurrencyCode,
  { symbol: string; flag: string; name: string; locale: string }
> = {
  USD: { symbol: "$", flag: "🇺🇸", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", flag: "🇪🇺", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", flag: "🇬🇧", name: "British Pound", locale: "en-GB" },
  ZAR: { symbol: "R", flag: "🇿🇦", name: "South African Rand", locale: "en-ZA" },
};

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
};

function formatNumber(amount: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(Math.abs(amount));
}

export function formatMoney(amount: number, currency: CurrencyCode | string): string {
  const code = (currency as CurrencyCode) in CURRENCIES ? (currency as CurrencyCode) : "USD";
  const sign = amount < 0 ? "-" : "";
  return `${sign}${SYMBOLS[code]}${formatNumber(amount)}`;
}

export function formatCompactMoney(amount: number, currency: CurrencyCode | string): string {
  const code = (currency as CurrencyCode) in CURRENCIES ? (currency as CurrencyCode) : "USD";
  const sign = amount < 0 ? "-" : "";
  return `${sign}${SYMBOLS[code]}${formatNumber(amount, {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export function greeting(name: string): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = name.split(" ")[0] || name;
  return `${part}, ${first}`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "UB";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function maskNumber(value: string | null | undefined, visible = 4): string {
  if (!value) return "—";
  const tail = value.slice(-visible);
  return `•••• ${tail}`;
}

export function accountLabel(a: {
  currency: string;
  account_number: string | null;
  iban: string | null;
  sort_code: string | null;
}): string {
  switch (a.currency) {
    case "USD":
      return a.account_number ? `Acct ••••${a.account_number.slice(-4)}` : "—";
    case "EUR":
      return a.iban ? `IBAN ••••${a.iban.slice(-4)}` : "—";
    case "GBP":
      return a.account_number ? `Acct ••••${a.account_number.slice(-4)}` : "—";
    case "ZAR":
      return a.account_number ? `Acct ••••${a.account_number.slice(-4)}` : "—";
    default:
      return "—";
  }
}
