import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/banking/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { markNotificationsReadFn } from "@/lib/banking.functions";
import type { AppNotification, Profile } from "@/lib/banking.functions";
import { formatDateTime, initials } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  ClipboardList,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  ShieldCheck,
  ShieldAlert,
  UserRound,
  Wallet,
} from "lucide-react";

const PRIMARY_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transfers", label: "Transfers & Payments", icon: Send },
  { to: "/accounts", label: "My Accounts", icon: Wallet },
  { to: "/security", label: "Security & Compliance", icon: ShieldCheck },
];

const SECONDARY_NAV = [{ to: "/transactions", label: "Transaction History", icon: ClipboardList }];

function isActive(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

export function AppShell({
  profile,
  notifications,
  children,
}: {
  profile: Profile;
  notifications: AppNotification[];
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
    router.invalidate();
  }

  async function handleMarkRead() {
    await markNotificationsReadFn();
    queryClient.invalidateQueries({ queryKey: ["shell"] });
  }

  const navItems = [
    ...PRIMARY_NAV,
    ...SECONDARY_NAV,
    ...(profile.role === "admin" ? [{ to: "/admin", label: "Admin Console", icon: Landmark }] : []),
  ];

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Executive sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy text-primary-foreground lg:flex">
        <div className="flex items-center bg-white px-5 py-5">
          <Logo className="h-12 w-full object-contain" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive(item.to, pathname)
                  ? "bg-white/10 font-semibold text-gold"
                  : "text-white/75 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="space-y-3 px-5 pb-6">
          <div className="gold-rule" />
          <div className="flex items-center gap-2 text-xs text-white/70">
            {profile.two_factor_enabled ? (
              <>
                <ShieldCheck className="h-4 w-4 text-gold" />
                <span>2FA active · encrypted session</span>
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4 text-warning" />
                <span>Two-factor authentication off</span>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur sm:px-6 lg:flex lg:justify-end">
          {/* Mobile: hamburger */}
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-navy text-white [&>button]:text-white">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="bg-white/95 p-3">
                  <Logo className="h-10 w-full object-contain" />
                </div>
                <nav className="mt-4 space-y-1 px-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                        isActive(item.to, pathname)
                          ? "bg-white/10 font-semibold text-gold"
                          : "text-white/80"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <button
                  onClick={handleSignOut}
                  className="mt-4 flex w-full items-center gap-2 rounded-lg px-5 py-2 text-sm text-white/70"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </SheetContent>
            </Sheet>
            <Link to="/dashboard" className="min-w-0">
              <Logo className="h-9 w-auto max-w-[180px] object-contain" />
            </Link>
          </div>

          {/* Desktop: session badge */}
          <div className="hidden items-center gap-2 lg:flex">
            <Badge variant="outline" className="gap-1.5 border-gold/40 bg-gold-soft/60 text-navy">
              <ShieldCheck className="h-3.5 w-3.5" />
              Encrypted session
            </Badge>
          </div>

          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                      {unread}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  Notifications
                  {unread > 0 && (
                    <button
                      onClick={handleMarkRead}
                      className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications
                  </p>
                )}
                {notifications.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-3">
                    <span className="flex w-full items-center gap-2 text-sm font-medium">
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />}
                      {n.title}
                    </span>
                    {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDateTime(n.created_at)}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 pl-1.5 pr-2"
                  aria-label="Account menu"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-gold">
                    {initials(profile.display_name)}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-sm font-medium sm:block">
                    {profile.display_name ?? "Client"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="truncate text-sm font-semibold">{profile.display_name}</p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {profile.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/security">
                    <UserRound className="h-4 w-4" /> Profile & Security
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium ${
              isActive(item.to, pathname) ? "text-navy" : "text-muted-foreground"
            }`}
          >
            <item.icon
              className={`h-5 w-5 shrink-0 ${isActive(item.to, pathname) ? "text-gold" : ""}`}
            />
            <span className="w-full truncate text-center leading-tight">
              {item.label.split(" ")[0]}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
