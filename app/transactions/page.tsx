"use client";


import Link from "next/link";
import { useEffect, useState } from "react";


type Transaction = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product: {
    title: string;
    seller_name: string;
    image_url: string;
  } | null;
};


export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch("/api/transactions");
        const data = await response.json();


        if (!response.ok) {
          setError(data.error || "Unable to load transactions.");
          return;
        }


        setTransactions(data.transactions ?? []);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };


    loadTransactions();
  }, []);


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
        Loading your transactions...
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
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
            My transactions
          </h1>


          <Link
            href="/seller/withdrawals"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "var(--pm-surface)",
              color: "var(--pm-text)",
              border: "1px solid var(--pm-border)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to withdrawals
          </Link>
        </div>


        {error && (
          <p style={{ color: "#ef4444", fontWeight: 700 }}>{error}</p>
        )}


        {!error && transactions.length === 0 && (
          <p>You have no transactions yet.</p>
        )}


        <div style={{ display: "grid", gap: 16 }}>
          {transactions.map((transaction) => (
            <Link
              key={transaction.id}
              href={`/transactions/${transaction.id}`}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                background: "var(--pm-surface)",
                border: "1px solid var(--pm-border)",
                borderRadius: 18,
                padding: 16,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {transaction.product?.image_url && (
                <img
                  src={transaction.product.image_url}
                  alt={transaction.product.title}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 14,
                    objectFit: "cover",
                  }}
                />
              )}


              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 800 }}>
                  {transaction.product?.title || "Product"}
                </p>


                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--pm-muted, #94a3b8)",
                  }}
                >
                  Seller: {transaction.product?.seller_name || "Unknown seller"}
                </p>


                <p style={{ margin: "6px 0 0", fontWeight: 800 }}>
                  ₦{Number(transaction.amount).toLocaleString("en-NG")}
                </p>
              </div>


              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  background:
                    transaction.status === "completed"
                      ? "rgba(34, 197, 94, 0.15)"
                      : transaction.status === "paid"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(148, 163, 184, 0.15)",
                  color:
                    transaction.status === "completed"
                      ? "#16a34a"
                      : transaction.status === "paid"
                      ? "#2563eb"
                      : "#64748b",
                }}
              >
                {transaction.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}