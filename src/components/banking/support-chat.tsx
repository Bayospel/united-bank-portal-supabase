import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { sendSupportMessageFn } from "@/lib/support.functions";

interface Msg {
  from: "bot" | "user";
  text: string;
}

const FAQ: { label: string; keywords: string[]; answer: string }[] = [
  {
    label: "I can't sign in",
    keywords: ["sign in", "login", "log in", "password", "locked", "access"],
    answer:
      "On the sign-in page choose “Forgot password” to receive a reset link by email. If you just registered, open the confirmation email first. Still stuck? Choose “Talk to an agent” below.",
  },
  {
    label: "Transfer fees",
    keywords: ["fee", "fees", "charge", "cost"],
    answer:
      "Fees per transfer: Domestic Wire 15.00 USD, SWIFT 45.00 USD, SEPA 3.50 EUR, Faster Payments 1.00 GBP, PayShap 2.00 ZAR, currency exchange 0.1% of the amount. Transfers to another United Bank client are free.",
  },
  {
    label: "Transfer limits",
    keywords: ["limit", "daily", "maximum", "max"],
    answer:
      "Your daily transfer limit is shown and adjustable on the Security page. A transfer is declined if it would exceed the limit or your available balance (amount plus fee).",
  },
  {
    label: "Verify my ID",
    keywords: ["id", "verify", "verification", "kyc", "document", "passport"],
    answer:
      "You can upload a government-issued photo ID during registration. Our team reviews submitted documents and your verification status updates on your account. Talk to an agent if you need to resubmit.",
  },
  {
    label: "Supported currencies",
    keywords: ["currency", "currencies", "usd", "eur", "gbp", "zar", "rand"],
    answer:
      "Your account includes USD, EUR, GBP and ZAR wallets. You can convert between them from the Transfers page at the live rate.",
  },
];

const GREETING: Msg = {
  from: "bot",
  text: "Hello, welcome to United Bank Offshore Customer Services. Pick a topic below, type your question, or choose “Talk to an agent”.",
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [agentMode, setAgentMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    void supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail((prev) => prev || u.email || "");
      const full = (u.user_metadata as Record<string, unknown> | undefined)?.["full_name"];
      if (typeof full === "string") setName((prev) => prev || full);
    });
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, agentMode, open]);

  function answer(question: string, label?: string) {
    const q = question.toLowerCase();
    const hit = FAQ.find((f) => f.label === label) ?? FAQ.find((f) => f.keywords.some((k) => q.includes(k)));
    setMessages((m) => [
      ...m,
      { from: "user", text: question },
      hit
        ? { from: "bot", text: hit.answer }
        : {
            from: "bot",
            text: "I couldn't find an instant answer to that. Choose “Talk to an agent” and our team will reply to you by email.",
          },
    ]);
  }

  function submitQuestion() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    answer(text);
  }

  async function submitAgent() {
    setError(null);
    setSending(true);
    try {
      const res = await sendSupportMessageFn({
        data: { name, email, message, website },
      });
      setMessages((m) => [
        ...m,
        { from: "user", text: message },
        {
          from: "bot",
          text: `Thank you. Your message has been sent to Customer Services (reference ${res.reference}). We will reply to ${email} as soon as possible.`,
        },
      ]);
      setMessage("");
      setAgentMode(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Customer Services chat"
        className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-gold/50 transition hover:bg-navy-deep lg:bottom-6 lg:right-6"
      >
        <MessageCircle className="h-5 w-5 text-gold" />
        <span className="hidden sm:inline">Customer Services</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Customer Services chat"
      className="fixed inset-x-3 bottom-20 top-16 z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl sm:inset-x-auto sm:right-4 sm:top-auto sm:h-[560px] sm:w-[380px] lg:bottom-6 lg:right-6"
    >
      <header className="flex items-center justify-between bg-navy px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">Customer Services</p>
          <p className="text-xs text-white/70">United Bank Offshore</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                m.from === "user" ? "bg-navy text-white" : "bg-muted text-foreground"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {agentMode ? (
        <div className="space-y-2 border-t p-3">
          <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Textarea
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={2000}
          />
          {/* Honeypot: hidden from people, bots tend to fill it */}
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            name="website"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setAgentMode(false)}>
              Back
            </Button>
            <Button type="button" className="flex-1" disabled={sending} onClick={() => void submitAgent()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to agent"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 border-t p-3">
          <div className="flex flex-wrap gap-2">
            {FAQ.map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => answer(f.label, f.label)}
                className="rounded-full border px-3 py-1 text-xs hover:bg-muted"
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAgentMode(true)}
              className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy"
            >
              Talk to an agent
            </button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion();
            }}
          >
            <Input placeholder="Type your question…" value={input} onChange={(e) => setInput(e.target.value)} />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
