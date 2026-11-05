"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase-client";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
};

type Product = {
  id: string;
  title: string;
  seller_id: string | null;
  seller_name: string | null;
  image_url: string | null;
};

function ChatContent() {
  const params = useParams();
  const productId = String(params.productId || "");

  const supabase = createSupabaseClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadMessages = useCallback(async () => {
    if (!userId || !product) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setMessages(data ?? []);
  }, [productId, product, userId, supabase]);

  useEffect(() => {
    async function loadChat() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setError("Please sign in to message the seller.");
        return;
      }

      setUserId(userData.user.id);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, title, seller_id, seller_name, image_url")
        .eq("id", productId)
        .single();

      if (productError || !productData) {
        setError("This product could not be found.");
        return;
      }

      setProduct(productData);
    }

    loadChat();
  }, [productId, supabase]);

  useEffect(() => {
    loadMessages();

    const timer = setInterval(loadMessages, 4000);

    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!userId || !product?.seller_id) return;
    if (!newMessage.trim() && !selectedFile) return;

    setSending(true);
    setError(null);

    try {
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;

      if (selectedFile) {
        const fileExtension = selectedFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-files")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: signedData } = await supabase.storage
          .from("chat-files")
          .createSignedUrl(fileName, 604800);

        attachmentUrl = signedData?.signedUrl ?? null;
        attachmentType = selectedFile.type.startsWith("image/")
          ? "image"
          : "file";
      }

      const { error: insertError } = await supabase.from("messages").insert({
        product_id: productId,
        sender_id: userId,
        receiver_id: product.seller_id,
        body: newMessage.trim() || null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });

      if (insertError) throw insertError;

      setNewMessage("");
      setSelectedFile(null);
      await loadMessages();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Message could not be sent."
      );
    } finally {
      setSending(false);
    }
  }

  if (error) {
    return (
      <main style={{ padding: 40 }}>
        <p>{error}</p>
        <Link href="/">← Back home</Link>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--pm-border)",
          background: "var(--pm-surface)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Link
          href="/"
          style={{
            textDecoration: "none",
            background: "#0b9e77",
            color: "white",
            padding: "8px 14px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          ← Back home
        </Link>

        <div>
          <strong>{product?.seller_name || "Seller"}</strong>
          <p style={{ margin: 0, fontSize: 12, color: "var(--pm-muted)" }}>
            {product?.title}
          </p>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((message) => {
          const isMine = message.sender_id === userId;

          return (
            <div
              key={message.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                maxWidth: "75%",
                padding: "12px 16px",
                borderRadius: 18,
                background: isMine ? "#0b9e77" : "var(--pm-surface)",
                color: isMine ? "white" : "var(--pm-text)",
                boxShadow: "var(--pm-shadow)",
              }}
            >
              {message.attachment_type === "image" &&
                message.attachment_url && (
                  <img
                    src={message.attachment_url}
                    alt="Chat image"
                    onClick={() => setFullScreenImage(message.attachment_url)}
                    style={{
                      width: "100%",
                      maxHeight: 260,
                      objectFit: "cover",
                      borderRadius: 12,
                      cursor: "pointer",
                      marginBottom: message.body ? 8 : 0,
                    }}
                  />
                )}

              {message.attachment_type === "file" &&
                message.attachment_url && (
                  <a
                    href={message.attachment_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: isMine ? "white" : "#0b9e77" }}
                  >
                    📎 View file
                  </a>
                )}

              {message.body && <p style={{ margin: 0 }}>{message.body}</p>}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div
        style={{
          padding: 16,
          borderTop: "1px solid var(--pm-border)",
          background: "var(--pm-surface)",
        }}
      >
        {selectedFile && (
          <p style={{ fontSize: 13, marginBottom: 8 }}>
            Attached: {selectedFile.name}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ cursor: "pointer" }}>
            📎
            <input
              type="file"
              hidden
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <label style={{ cursor: "pointer" }}>
            📷
            <input
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] ?? null)
              }
            />
          </label>

          <input
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            placeholder="Type a message"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 999,
              border: "1px solid var(--pm-border)",
              background: "var(--pm-bg)",
              color: "var(--pm-text)",
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              padding: "12px 18px",
              borderRadius: 999,
              border: 0,
              background: "#0b9e77",
              color: "white",
              fontWeight: 700,
            }}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, marginTop: 8 }}>
            {error}
          </p>
        )}
      </div>

      {fullScreenImage && (
        <div
          onClick={() => setFullScreenImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.95)",
            display: "grid",
            placeItems: "center",
            cursor: "zoom-out",
          }}
        >
          <img
            src={fullScreenImage}
            alt="Full screen chat image"
            style={{
              maxWidth: "100%",
              maxHeight: "95vh",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main style={{ padding: 40 }}>
          <p>Loading chat...</p>
        </main>
      }
    >
      <ChatContent />
    </Suspense>
  );
}