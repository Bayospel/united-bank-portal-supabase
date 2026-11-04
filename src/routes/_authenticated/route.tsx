import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/banking/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getShellData } from "@/lib/banking.functions";
import { sendWelcomeEmailFn } from "@/lib/support.functions";

export const shellQueryOptions = {
  queryKey: ["shell"] as const,
  queryFn: () => getShellData(),
};

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  loader: ({ context }: { context: { queryClient: QueryClient } }) =>
    context.queryClient.ensureQueryData(shellQueryOptions),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data } = useSuspenseQuery(shellQueryOptions);

  // First visit after signup/confirmation: send the Resend welcome email (once per user).
  useEffect(() => {
    void sendWelcomeEmailFn().catch(() => undefined);
  }, []);

  return (
    <AppShell profile={data.profile} notifications={data.notifications}>
      <Outlet />
    </AppShell>
  );
}
