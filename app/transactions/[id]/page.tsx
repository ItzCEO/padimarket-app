"use client";


import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


type Transaction = {
  id: string;
  amount: number;
  status: string;
  payment_reference: string;
  created_at: string;
  completed_at: string | null;
  product: {
    title: string;
    seller_name: string;
    seller_phone: string;
    image_url: string;
  } | null;
};


export default function TransactionReceiptPage() {
  const params = useParams();
  const transactionId = params.id as string;


  const receiptRef = useRef<HTMLDivElement>(null);


  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");


  useEffect(() => {
    const loadTransaction = async () => {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) {
        setMessage("Please sign in again.");
        setLoading(false);
        return;
      }


      const response = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "Unable to load transaction.");
        setLoading(false);
        return;
      }


      setTransaction(data.transaction);
      setLoading(false);
    };


    loadTransaction();
  }, [transactionId]);


  const completeHandshake = async () => {
    setMessage("");
    setConfirming(true);


    try {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) {
        setMessage("Please sign in again.");
        return;
      }


      const response = await fetch("/api/transactions/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transactionId,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "Unable to complete handshake.");
        return;
      }


      setTransaction({
        ...transaction!,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setConfirming(false);
    }
  };


  const downloadReceipt = async () => {
    if (!receiptRef.current || !transaction) return;


    setDownloading(true);


    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });


      const imgData = canvas.toDataURL("image/png");


      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });


      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;


      pdf.addImage(imgData, "PNG", 40, 40, imgWidth, imgHeight);


      pdf.save(`PadiMarket-Receipt-${transaction.id.slice(0, 8)}.pdf`);
    } catch {
      setMessage("Could not download the receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };


  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--pm-bg)",
          color: "var(--pm-text)",
        }}
      >
        Loading receipt...
      </main>
    );
  }


  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Link
            href="/transactions"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "var(--pm-surface, #ffffff)",
              color: "var(--pm-text, #0f172a)",
              border: "1px solid var(--pm-border, #e5e7eb)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to transactions
          </Link>
        </div>


        <div
          ref={receiptRef}
          style={{
            background: "var(--pm-surface, #ffffff)",
            color: "var(--pm-text, #0f172a)",
            border: "1px solid var(--pm-border, #e5e7eb)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <img
              src="/logo-new.png"
              alt="PadiMarket logo"
              crossOrigin="anonymous"
              style={{
                width: 46,
                height: 46,
                objectFit: "contain",
                borderRadius: 12,
              }}
            />


            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                PadiMarket
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  color: "var(--pm-muted, #94a3b8)",
                }}
              >
                Transaction receipt
              </p>
            </div>
          </div>


          {transaction?.product?.image_url && (
            <img
              src={transaction.product.image_url}
              alt={transaction.product.title}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: 180,
                objectFit: "cover",
                borderRadius: 16,
                marginBottom: 20,
              }}
            />
          )}


          <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
            {transaction?.product?.title || "Product"}
          </h2>


          <p
            style={{
              margin: "0 0 20px",
              fontSize: 14,
              color: "var(--pm-muted, #94a3b8)",
            }}
          >
            Sold by {transaction?.product?.seller_name || "Unknown seller"}
          </p>


          <div
            style={{
              display: "grid",
              gap: 12,
              fontSize: 14,
              borderTop: "1px dashed var(--pm-border, #e5e7eb)",
              paddingTop: 20,
            }}
          >
            <Row
              label="Amount"
              value={`₦${Number(transaction?.amount || 0).toLocaleString(
                "en-NG"
              )}`}
            />
            <Row label="Status" value={transaction?.status || ""} />
            <Row
  label="Date"
  value={new Date(transaction?.created_at || "").toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  })}
/>
            <Row label="Transaction ID" value={transaction?.id || ""} />
            <Row
              label="Payment reference"
              value={transaction?.payment_reference || "—"}
            />
            {transaction?.completed_at && (
             <Row
  label="Completed"
  value={new Date(transaction.completed_at).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  })}
/>
            )}
          </div>


          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              color: "var(--pm-muted, #94a3b8)",
              textAlign: "center",
            }}
          >
            Thank you for using PadiMarket.
          </p>
        </div>


        {message && (
          <p
            style={{
              marginTop: 16,
              fontWeight: 700,
              color: "#b7791f",
              textAlign: "center",
            }}
          >
            {message}
          </p>
        )}


        {transaction?.status !== "completed" && (
          <button
            onClick={completeHandshake}
            disabled={confirming}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "14px 18px",
              borderRadius: 999,
              border: "none",
              background: confirming ? "#6b7280" : "#0b9e77",
              color: "#04231b",
              fontWeight: 800,
              cursor: confirming ? "wait" : "pointer",
            }}
          >
            {confirming
              ? "Completing handshake..."
              : "I have received the item — complete handshake"}
          </button>
        )}


        <button
          onClick={downloadReceipt}
          disabled={downloading}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "14px 18px",
            borderRadius: 999,
            border: "1px solid var(--pm-border, #e5e7eb)",
            background: "transparent",
            color: "inherit",
            fontWeight: 800,
            cursor: downloading ? "wait" : "pointer",
          }}
        >
          {downloading ? "Preparing PDF..." : "Download receipt"}
        </button>
      </div>
    </main>
  );
}


function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <span style={{ color: "var(--pm-muted, #94a3b8)" }}>{label}</span>
      <span
        style={{
          fontWeight: 700,
          textAlign: "right",
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}