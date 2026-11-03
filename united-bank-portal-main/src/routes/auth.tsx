import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";

import { Logo } from "@/components/banking/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Client Login | United Bank Offshore" },
      {
        name: "description",
        content: "Sign in to your United Bank Offshore multi-currency banking console.",
      },
      { property: "og:title", content: "Client Login | United Bank Offshore" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmSent, setConfirmSent] = useState(false);

  const passwordSignIn = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    onSuccess: async () => {
      queryClient.clear();
      await navigate({ to: "/dashboard" });
    },
    onError: (e) => toast.error(e.message),
  });

  const signUp = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        queryClient.clear();
        void navigate({ to: "/dashboard" });
      } else {
        setConfirmSent(true);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const sendReset = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reset link sent — check your inbox.");
      setMode("signin");
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error(result.error.message);
  }


  const busy = passwordSignIn.isPending || signUp.isPending || sendReset.isPending;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(55% 70% at 85% 15%, oklch(0.73 0.095 85 / 0.35), transparent), radial-gradient(45% 60% at 10% 95%, oklch(0.4 0.08 262 / 0.8), transparent)",
          }}
        />
        <div className="relative">
          <div className="inline-block rounded-xl bg-white px-4 py-2.5">
            <Logo className="h-11 w-auto" />
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-3xl font-bold leading-snug">
            Your offshore treasury,
            <br />
            <span className="text-gold">one encrypted console.</span>
          </h1>
          <ul className="mt-8 space-y-4 text-sm text-white/75">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              Two-factor authentication and trusted device management
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              Encrypted sessions with a full login audit trail
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              USD, EUR, GBP and ZAR wallets with dedicated account details
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/50">
          Global banking. Borderless opportunities.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 rounded-xl bg-white lg:hidden">
          <Logo className="h-16 w-auto" />
        </div>

        <div className="w-full max-w-md">
          {confirmSent ? (
            <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
              <h2 className="mt-4 font-display text-xl font-bold text-navy">Confirm your email</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
                account, then sign in.
              </p>
              <Button variant="outline" className="mt-6" onClick={() => setMode("signin")}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-display text-2xl font-bold text-navy">
                {mode === "signup" ? "Open your account" : mode === "forgot" ? "Reset password" : "Client login"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signup"
                  ? "Multi-currency accounts are provisioned instantly."
                  : mode === "forgot"
                    ? "We'll email you a secure reset link."
                    : "Secure access to your accounts."}
              </p>

              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (mode === "signin") passwordSignIn.mutate();
                  else if (mode === "signup") signUp.mutate();
                  else sendReset.mutate();
                }}
              >
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      required
                      placeholder="Alexander Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs text-muted-foreground underline-offset-2 hover:text-navy hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                )}
                <Button type="submit" disabled={busy} className="w-full bg-navy text-white hover:bg-navy/90">
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
                </Button>
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or continue with
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div>
                    <Button variant="outline" className="w-full" onClick={handleGoogle}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.43 3.45 1.18 4.94l3.66-2.84z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                        />
                      </svg>
                      Continue with Google
                    </Button>
                  </div>

                  <p className="mt-6 text-center text-sm text-muted-foreground">
                    {mode === "signin" ? "New to United Bank Offshore?" : "Already a client?"}{" "}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                      className="font-medium text-navy underline-offset-2 hover:underline"
                    >
                      {mode === "signin" ? "Open an account" : "Sign in"}
                    </button>
                  </p>
                </>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline-offset-2 hover:underline">
              ← Back to unitedbank.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
