"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase-client";

type Message = {
  id: string;
  product_id: string | null;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  created_at: string;
};

export default function MessagesPage() {
  const supabase = createSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessages() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      setUserId(userData.user.id);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `sender_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`
        )
        .order("created_at", { ascending: false });

      setMessages(data ?? []);
    }

    loadMessages();
  }, [supabase]);

  const conversations = messages.reduce<Record<string, Message>>(
    (groups, message) => {
      const key = message.product_id ?? message.id;

      if (!groups[key]) {
        groups[key] = message;
      }

      return groups;
    },
    {}
  );

  return (
    <main style={{ padding: 40 }}>
      <h1>Messages</h1>

      {Object.values(conversations).length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {Object.values(conversations).map((message) => (
            <Link
              key={message.id}
              href={message.product_id ? `/chat/${message.product_id}` : "/"}
              style={{
                display: "block",
                padding: 18,
                borderRadius: 18,
                background: "var(--pm-surface)",
                color: "var(--pm-text)",
                textDecoration: "none",
                boxShadow: "var(--pm-shadow)",
              }}
            >
              <strong>Product chat</strong>
              <p style={{ margin: "6px 0 0", color: "var(--pm-muted)" }}>
                {message.body || "Sent an attachment"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}