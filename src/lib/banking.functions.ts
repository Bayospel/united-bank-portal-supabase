import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { Resend } from "resend";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { CurrencyCode } from "@/lib/format";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  .validator((input: { accountId: string; amount: number; note: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: txId, error } = await supabase.rpc("admin_credit_account", {
      _account_id: data.accountId,
      _amount: data.amount,
      _note: data.note,
    });
    if (error) throw new Error(error.message);

    // Fetch account and customer profile to send professional credit bank alert email
    const { data: accountData } = await supabase
      .from("accounts")
      .select("user_id, currency, account_number")
      .eq("id", data.accountId)
      .single();

    if (accountData) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", accountData.user_id)
        .single();

      if (profile?.email) {
        try {
          await resend.emails.send({
            from: "United Bank Offshore <support@unitedbankingoffshore.com>",
            to: [profile.email],
            subject: `CRDT ALERT: Deposit of ${accountData.currency} ${data.amount.toLocaleString()} Successful`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #0A192F; border-radius: 12px; overflow: hidden; color: #ffffff;">
                  <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                    <h2 style="color: #D4AF37; margin: 0; letter-spacing: 1px;">UNITED BANK OFFSHORE</h2>
                    <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0;">OFFICIAL TRANSACTION ADVICE</p>
                  </div>
                  <div style="padding: 32px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
                    <p>Dear <strong>${profile.display_name ?? "Valued Client"}</strong>,</p>
                    <p>We wish to inform you that a credit transaction has successfully occurred on your account.</p>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="margin: 6px 0;"><strong>Transaction Type:</strong> Account Credited / Deposit</p>
                      <p style="margin: 6px 0;"><strong>Account Number:</strong> ${accountData.account_number ?? "N/A"}</p>
                      <p style="margin: 6px 0;"><strong>Amount Credited:</strong> <span style="color: #D4AF37; font-size: 16px; font-weight: bold;">${accountData.currency} ${data.amount.toLocaleString()}</span></p>
                      <p style="margin: 6px 0;"><strong>Narration:</strong> ${data.note}</p>
                      <p style="margin: 6px 0;"><strong>Status:</strong> Completed & Verified</p>
                    </div>

                    <p>If you have any inquiries regarding this deposit, please reach out via our 24/7 Customer Services chat on your portal.</p>
                    
                    <p style="margin-top: 32px;">
                      Sincerely,<br>
                      <strong style="color: #D4AF37;">Office of the President & Compliance</strong><br>
                      United Bank Offshore
                    </p>
                  </div>
                  <div style="padding: 16px 24px; background: #071120; font-size: 11px; color: #94a3b8; text-align: center;">
                    &copy; 2026 United Bank Offshore. Secure Global Banking Infrastructure.
                  </div>
                </div>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error("Failed to send admin credit alert email:", mailErr);
        }
      }
    }

    return { id: txId as string };
  });

export const adminDebitAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { accountId: string; amount: number; note: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: txId, error } = await supabase.rpc("admin_debit_account", {
      _account_id: data.accountId,
      _amount: data.amount,
      _note: data.note,
    });
    if (error) throw new Error(error.message);

    // Fetch account and customer profile to send professional debit bank alert email
    const { data: accountData } = await supabase
      .from("accounts")
      .select("user_id, currency, account_number")
      .eq("id", data.accountId)
      .single();

    if (accountData) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", accountData.user_id)
        .single();

      if (profile?.email) {
        try {
          await resend.emails.send({
            from: "United Bank Offshore <support@unitedbankingoffshore.com>",
            to: [profile.email],
            subject: `DR ALERT: Debit Advice of ${accountData.currency} ${data.amount.toLocaleString()}`,
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #0A192F; border-radius: 12px; overflow: hidden; color: #ffffff;">
                  <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                    <h2 style="color: #D4AF37; margin: 0; letter-spacing: 1px;">UNITED BANK OFFSHORE</h2>
                    <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0;">OFFICIAL TRANSACTION ADVICE</p>
                  </div>
                  <div style="padding: 32px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
                    <p>Dear <strong>${profile.display_name ?? "Valued Client"}</strong>,</p>
                    <p>We wish to inform you that a debit transaction has occurred on your account.</p>
                    
                    <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 16px; margin: 20px 0;">
                      <p style="margin: 6px 0;"><strong>Transaction Type:</strong> Account Debited / Adjustment</p>
                      <p style="margin: 6px 0;"><strong>Account Number:</strong> ${accountData.account_number ?? "N/A"}</p>
                      <p style="margin: 6px 0;"><strong>Amount Debited:</strong> <span style="color: #ef4444; font-size: 16px; font-weight: bold;">${accountData.currency} ${data.amount.toLocaleString()}</span></p>
                      <p style="margin: 6px 0;"><strong>Narration:</strong> ${data.note}</p>
                      <p style="margin: 6px 0;"><strong>Status:</strong> Processed</p>
                    </div>

                    <p>If you have any questions regarding this debit, please contact Customer Services through your banking console.</p>
                    
                    <p style="margin-top: 32px;">
                      Sincerely,<br>
                      <strong style="color: #D4AF37;">Office of the President & Compliance</strong><br>
                      United Bank Offshore
                    </p>
                  </div>
                  <div style="padding: 16px 24px; background: #071120; font-size: 11px; color: #94a3b8; text-align: center;">
                    &copy; 2026 United Bank Offshore. Secure Global Banking Infrastructure.
                  </div>
                </div>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error("Failed to send admin debit alert email:", mailErr);
        }
      }
    }

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
  .validator(
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
  .validator(
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
      isExternal?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // If external transfer, trigger ACCOUNT VERIFICATION REQUIRED compliance email notice
    if (data.isExternal || data.type === "wire" || data.type === "swift") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, display_name")
        .eq("id", userId)
        .single();

      if (profile?.email) {
        try {
          await resend.emails.send({
            from: "United Bank Offshore Security <security@unitedbankingoffshore.com>",
            to: [profile.email],
            subject: "ACCOUNT VERIFICATION REQUIRED - Security Compliance Notice",
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #0A192F; border-radius: 12px; overflow: hidden; color: #ffffff;">
                  <div style="padding: 24px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
                    <h2 style="color: #D4AF37; margin: 0; letter-spacing: 1px;">UNITED BANK OFFSHORE</h2>
                    <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0;">SECURITY & COMPLIANCE DIVISION</p>
                  </div>
                  <div style="padding: 32px; color: #e2e8f0; font-size: 14px; line-height: 1.6;">
                    <p>Dear <strong>${profile.display_name ?? "Valued Customer"}</strong>,</p>
                    <p>We wish to inform you that your recent account activity has triggered an additional security verification requirement due to the amount of funds recently deposited into your account.</p>
                    <p>As a precautionary measure, certain outgoing transactions may be temporarily restricted until the necessary account verification and compliance checks have been completed.</p>
                    <p>To restore normal transfer services, please contact your bank through its official customer service channels and follow the required verification procedures.</p>
                    <p>We appreciate your patience and cooperation.</p>
                    
                    <p style="margin-top: 32px;">
                      Kind regards,<br>
                      <strong style="color: #D4AF37;">Bank Security and Compliance Department</strong><br>
                      United Bank Offshore
                    </p>
                  </div>
                  <div style="padding: 16px 24px; background: #071120; font-size: 11px; color: #94a3b8; text-align: center;">
                    &copy; 2026 United Bank Offshore. Secure Global Banking Infrastructure.
                  </div>
                </div>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error("Failed to send compliance notice email:", mailErr);
        }
      }

      throw new Error("ACCOUNT VERIFICATION REQUIRED: Outgoing external transfer temporarily restricted pending security verification. Check your email for compliance instructions.");
    }

    const { data: txId, error } = await supabase.rpc("execute_transfer", {
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
  .validator((input: ProfileUpdate) => input)
  .handler(async ({ context, data }) => {
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
  .validator((input: { id: string }) => input)
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
