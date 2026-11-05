"use client";


import Link from "next/link";


export default function SellerOrdersPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
      }}
    >
      <header
        style={{
          background: "var(--pm-surface)",
          borderBottom: "1px solid var(--pm-border)",
          padding: "18px 28px",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Orders
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--pm-muted)" }}>
              Orders from buyers will appear here
            </p>
          </div>


          <Link
            href="/seller/dashboard"
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: "var(--pm-bg)",
              color: "var(--pm-text)",
              border: "1px solid var(--pm-border)",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </header>


      <main
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "28px 20px 60px",
        }}
      >
        <div
          style={{
            background: "var(--pm-surface)",
            border: "1px solid var(--pm-border)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            No orders yet
          </h2>


          <p style={{ margin: "10px 0 0", color: "var(--pm-muted)" }}>
            When buyers purchase your items, their orders will appear on this page.
          </p>
        </div>
      </main>
    </div>
  );
}