import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/banking/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | United Bank Offshore" },
      { name: "description", content: "Set a new password for your United Bank Offshore account." },
      { property: "og:title", content: "Reset Password | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [isRecovery, setIsRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const check = async () => {
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        setIsRecovery(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setIsRecovery(!!data.session);
    };
    void check();
  }, []);

  const update = useMutation({
    mutationFn: async () => {
      if (password !== confirm) throw new Error("Passwords do not match");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Password updated. Welcome back.");
      await navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 rounded-xl bg-white">
        <Logo className="h-20 w-auto" />
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy text-gold">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password you haven't used before.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={update.isPending || !isRecovery}
            className="w-full bg-navy text-white hover:bg-navy/90"
          >
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRecovery ? "Update password" : "Validating secure link…"}
          </Button>
        </form>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        <Link to="/auth" className="underline-offset-2 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
