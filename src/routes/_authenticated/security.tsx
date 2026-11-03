import { QueryClient, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { removeDeviceFn, updateProfileFn, type ProfileUpdate } from "@/lib/banking.functions";
import { dashboardQueryOptions } from "@/routes/_authenticated/dashboard";
import { CURRENCIES, formatDateTime, initials } from "@/lib/format";
import {
  Bell,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  LogOut,
  Smartphone,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({
    meta: [
      { title: "Security & Compliance | United Bank Offshore" },
      {
        name: "description",
        content: "Two-factor authentication, trusted devices, transfer limits and audit log.",
      },
      { property: "og:title", content: "Security & Compliance | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: Security,
});

function Security() {
  const { data } = useSuspenseQuery(dashboardQueryOptions);
  const queryClient = useQueryClient();
  const { profile, devices, events } = data;

  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [limit, setLimit] = useState(String(Number(profile.daily_transfer_limit)));

  useEffect(() => {
    setDisplayName(profile.display_name ?? "");
    setLimit(String(Number(profile.daily_transfer_limit)));
  }, [profile.display_name, profile.daily_transfer_limit]);

  const save = useMutation({
    mutationFn: (data: ProfileUpdate) => updateProfileFn({ data }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shell"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const removeDevice = useMutation({
    mutationFn: (data: { id: string }) => removeDeviceFn({ data }),
    onSuccess: () => {
      toast.success("Device removed");
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(e.message),
  });

  function toggle(key: "two_factor_enabled" | "biometric_enabled" | "notifications_enabled", value: boolean) {
    save.mutate({ [key]: value } as ProfileUpdate);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-navy sm:text-3xl">
          Security &amp; Compliance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Two-factor authentication, trusted devices, limits and your audit trail.
        </p>
      </header>

      {/* Profile */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy font-display text-lg font-bold text-gold">
            {initials(profile.display_name)}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-navy">Profile</h2>
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Preferred currency</Label>
            <Select
              value={profile.preferred_currency}
              onValueChange={(v) => save.mutate({ preferred_currency: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CURRENCIES) as (keyof typeof CURRENCIES)[]).map((code) => (
                  <SelectItem key={code} value={code}>
                    {CURRENCIES[code].flag} {CURRENCIES[code].name} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="mt-4 bg-navy text-white hover:bg-navy/90"
          disabled={save.isPending || displayName.trim() === (profile.display_name ?? "")}
          onClick={() => save.mutate({ display_name: displayName.trim() })}
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </section>

      {/* Authentication & alerts */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Authentication &amp; alerts</h2>
        <div className="mt-4 divide-y">
          <ToggleRow
            icon={<KeyRound className="h-4 w-4 text-gold" />}
            title="Two-factor authentication (2FA)"
            description="Require a second verification step at every sign-in."
            checked={profile.two_factor_enabled}
            onChange={(v) => toggle("two_factor_enabled", v)}
            pending={save.isPending}
            highlight={!profile.two_factor_enabled}
          />
          <ToggleRow
            icon={<Fingerprint className="h-4 w-4 text-gold" />}
            title="Biometric sign-in"
            description="Use fingerprint or face unlock on supported devices."
            checked={profile.biometric_enabled}
            onChange={(v) => toggle("biometric_enabled", v)}
            pending={save.isPending}
          />
          <ToggleRow
            icon={<Bell className="h-4 w-4 text-gold" />}
            title="Transaction & security alerts"
            description="In-app notifications for payments, logins and limit changes."
            checked={profile.notifications_enabled}
            onChange={(v) => toggle("notifications_enabled", v)}
            pending={save.isPending}
          />
        </div>
      </section>

      {/* Limits */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Transaction limits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily aggregate outbound transfer limit across all your wallets.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-40 space-y-1.5">
            <Label htmlFor="limit">Daily limit (USD)</Label>
            <Input
              id="limit"
              type="number"
              min="100"
              step="100"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <Button
            className="bg-navy text-white hover:bg-navy/90"
            disabled={
              save.isPending ||
              !Number.isFinite(Number(limit)) ||
              Number(limit) <= 0 ||
              Number(limit) === Number(profile.daily_transfer_limit)
            }
            onClick={() => save.mutate({ daily_transfer_limit: Number(limit) })}
          >
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update limit
          </Button>
        </div>
      </section>

      {/* Devices */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Trusted devices</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Devices that have recently signed in to your account.
        </p>
        <ul className="mt-4 divide-y">
          {devices.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">No devices yet</li>
          )}
          {devices.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted">
                  {d.platform?.toLowerCase().includes("mobile") ? (
                    <Smartphone className="h-4 w-4 text-navy" />
                  ) : (
                    <Laptop className="h-4 w-4 text-navy" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last active {formatDateTime(d.last_active)}
                  </p>
                </div>
                {d.trusted && (
                  <Badge variant="outline" className="shrink-0 border-gold/40 bg-gold-soft/60 text-[10px] text-navy">
                    Trusted
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={removeDevice.isPending}
                onClick={() => removeDevice.mutate({ id: d.id })}
              >
                <LogOut className="h-3.5 w-3.5" /> Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Audit log */}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-navy">Security &amp; audit log</h2>
        <ul className="mt-4 space-y-3">
          {events.length === 0 && (
            <li className="py-4 text-center text-sm text-muted-foreground">No events yet</li>
          )}
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.event_type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[e.device, e.ip_address, e.location].filter(Boolean).join(" · ") ||
                    "Details unavailable"}
                </p>
              </div>
              <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                {formatDateTime(e.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Compliance note */}
      <section className="rounded-2xl bg-navy p-5 text-white sm:p-6">
        <h2 className="font-display text-lg font-semibold text-gold">Compliance statement</h2>
        <p className="mt-2 text-sm text-white/70">
          United Bank Offshore maintains records of every transaction and security event in
          accordance with international offshore banking regulations. Your statements are retained
          and available for download at any time. Sessions are encrypted end-to-end.
        </p>
      </section>
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  pending,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  pending: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
            highlight ? "bg-destructive/10" : "bg-muted"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={pending} />
    </div>
  );
}

