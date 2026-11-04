import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CurrencyCode } from "@/lib/format";

export interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  notifications_enabled: boolean;
  biometric_enabled: boolean;
  two_factor_enabled: boolean;
  daily_transfer_limit: number;
  last_login_at: string | null;
  created_at: string;
  residential_address: string | null;
  employment_details: string | null;
  date_of_birth: string | null;
  government_id_status: string;
  government_id_path: string | null;
}

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

export interface Account {
  id: string;
  currency: CurrencyCode;
  nickname: string | null;
  balance: number;
  account_number: string | null;
  routing_number: string | null;
  iban: string | null;
  bic: string | null;
  sort_code: string | null;
  status: string;
}

export interface Transaction {
  id: string;
  source_account_id: string | null;
  type: string;
  direction: string;
  amount: number;
  currency: string;
  target_amount: number | null;
  target_currency: string | null;
  fx_rate: number | null;
  fee: number;
  counterparty_name: string | null;
  counterparty_details: string | null;
  reference: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

export interface Device {
  id: string;
  name: string;
  platform: string | null;
  trusted: boolean;
  last_active: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  device: string | null;
  ip_address: string | null;
  location: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  severity: string;
  read: boolean;
  created_at: string;
}

export interface Rate {
  id: string;
  pair: string;
  rate: number;
  change_24h: number;
  updated_at: string;
}

export const getShellData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, notifRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, display_name, email, avatar_url, preferred_currency, notifications_enabled, biometric_enabled, two_factor_enabled, daily_transfer_limit, last_login_at, created_at, role, residential_address, employment_details, date_of_birth, government_id_status, government_id_path",
        )
        .eq("id", userId)
        .single(),
      supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    if (notifRes.error) throw new Error(notifRes.error.message);
    return {
      profile: profileRes.data as Profile,
      notifications: (notifRes.data ?? []) as AppNotification[],
    };
  });

export const getAdminCustomersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("admin_list_customers");
    if (error) throw new Error(error.message);
    return (data ?? []) as AdminCustomer[];
  });

export const adminCreditAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { accountId: string; amount: number; note: string }) => input)
  .handler(async ({ context, data }) => {
    const { data: txId, error } = await context.supabase.rpc("admin_credit_account", {
      _account_id: data.accountId,
      _amount: data.amount,
      _note: data.note,
    });
    if (error) throw new Error(error.message);
    return { id: txId as string };
  });

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profileRes, accountsRes, txRes, ratesRes, devicesRes, eventsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("accounts").select("*").eq("user_id", userId).order("currency"),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("exchange_rates").select("*").order("pair"),
      supabase
        .from("trusted_devices")
        .select("*")
        .eq("user_id", userId)
        .order("last_active", { ascending: false }),
      supabase
        .from("security_events")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    for (const r of [accountsRes, txRes, ratesRes, devicesRes, eventsRes]) {
      if (r.error) throw new Error(r.error.message);
    }

    // Record a "Signed in" audit entry at most once per hour.
    const profile = profileRes.data as Profile;
    const last = profile.last_login_at ? new Date(profile.last_login_at).getTime() : 0;
    if (Date.now() - last > 60 * 60 * 1000) {
      const ua = getRequestHeader("user-agent") ?? "";
      const device = /Mobile|Android|iPhone/.test(ua) ? "Mobile browser" : "Desktop browser";
      const now = new Date().toISOString();
      await Promise.all([
        supabase.from("security_events").insert({
          user_id: userId,
          event_type: "Signed in",
          device,
          ip_address: null,
          location: null,
        }),
        supabase.from("profiles").update({ last_login_at: now }).eq("id", userId),
      ]);
      profile.last_login_at = now;
    }

    return {
      profile,
      accounts: (accountsRes.data ?? []) as Account[],
      transactions: (txRes.data ?? []) as Transaction[],
      rates: (ratesRes.data ?? []) as Rate[],
      devices: (devicesRes.data ?? []) as Device[],
      events: (eventsRes.data ?? []) as SecurityEvent[],
    };
  });

export const getTransactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      currency?: string | undefined;
      type?: string | undefined;
      limit?: number | undefined;
      sourceAccountId?: string | undefined;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("transactions")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(Math.min(data?.limit ?? 100, 200));
    if (data?.currency) query = query.eq("currency", data.currency);
    if (data?.type) query = query.eq("type", data.type);
    if (data?.sourceAccountId) query = query.eq("source_account_id", data.sourceAccountId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as Transaction[];
  });

export const executeTransferFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      sourceAccountId: string;
      type: string;
      amount: number;
      counterpartyName: string;
      counterpartyDetails: string;
      reference: string;
      targetAccountId?: string | undefined;
      description?: string | undefined;
      targetAccountIdentifier?: string | undefined;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const { data: txId, error } = await context.supabase.rpc("execute_transfer", {
      _source_account_id: data.sourceAccountId,
      _type: data.type,
      _amount: data.amount,
      _counterparty_name: data.counterpartyName ?? null,
      _counterparty_details: data.counterpartyDetails ?? null,
      _reference: data.reference ?? null,
      ...(data.targetAccountId ? { _target_account_id: data.targetAccountId } : {}),
      ...(data.description ? { _description: data.description } : {}),
      ...(data.targetAccountIdentifier
        ? { _target_account_identifier: data.targetAccountIdentifier }
        : {}),
    });
    if (error) throw new Error(error.message);
    return { id: txId as string };
  });

export interface ProfileUpdate {
  display_name?: string | undefined;
  preferred_currency?: string | undefined;
  two_factor_enabled?: boolean | undefined;
  biometric_enabled?: boolean | undefined;
  notifications_enabled?: boolean | undefined;
  daily_transfer_limit?: number | undefined;
}

export const updateProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ProfileUpdate) => input)
  .handler(async ({ context, data }) => {
    // Drop undefined keys so the update payload is valid under exactOptionalPropertyTypes.
    const patch = Object.fromEntries(Object.entries(data ?? {}).filter(([, v]) => v !== undefined));
    const { error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeDeviceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("trusted_devices")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationsReadFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", context.userId)
      .eq("read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
