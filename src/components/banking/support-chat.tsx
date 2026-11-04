import { useEffect, useRef, useState } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender_type: string; message: string; created_at: string }>>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial chat history
  useEffect(() => {
    if (!isOpen) return;
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    };
    fetchHistory();
  }, [isOpen]);

  // Real-time listener for admin replies
  useEffect(() => {
    if (!isOpen) return;
    let channel: any;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      channel = supabase
        .channel(`customer-support-${user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `user_id=eq.${user.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as any]);
          }
        )
        .subscribe();
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("support_messages").insert({
        user_id: user.id,
        sender_type: "customer",
        message: inputMsg.trim(),
      });

      if (error) throw error;
      setInputMsg("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-navy text-gold shadow-lg hover:bg-navy/90"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      ) : (
        <div className="flex h-[480px] w-[360px] flex-col rounded-2xl border bg-card shadow-xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-navy p-4 text-white rounded-t-2xl">
            <div>
              <h3 className="font-display font-semibold">Customer Support</h3>
              <p className="text-xs text-gold">Connected with live admin</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages Body */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-xs bg-surface">
            {messages.length === 0 ? (
              <div className="py-24 text-center text-muted-foreground">
                <p className="font-semibold text-navy">Welcome to Support</p>
                <p className="mt-1">Send a message below and our admin team will reply to you shortly.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_type === "customer" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                      msg.sender_type === "customer"
                        ? "bg-navy text-white rounded-br-none"
                        : "bg-card border text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input Footer */}
          <div className="border-t p-3 bg-card rounded-b-2xl flex gap-2">
            <Input
              placeholder="Type your message to admin..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
            />
            <Button
              className="bg-gold text-navy hover:bg-gold/90"
              onClick={handleSendMessage}
              disabled={loading || !inputMsg.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
