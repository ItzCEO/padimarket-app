"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase-client";


type Listing = {
  id: string;
  title: string;
  price: number;
  location?: string | null;
  image_url?: string | null;
  status?: string | null;
};


export default function SellerDashboardPage() {
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [markingSoldOut, setMarkingSoldOut] = useState<string | null>(null);
  const [message, setMessage] = useState("");


  useEffect(() => {
    const loadDashboard = async () => {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;
      const userId = session?.user?.id;


      if (!token || !userId) {
        router.push("/login");
        return;
      }


      const response = await fetch("/api/seller/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      const data = await response.json();


      if (!response.ok) {
        router.push("/seller/verify");
        return;
      }


      setSeller(data.seller);
      setUserName(data.user?.email || "Seller");


      const { data: products, error } = await supabase
        .from("products")
        .select("id, title, price, location, image_url, status")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });


      if (error) {
        console.error("Error loading seller listings:", error);
      } else {
        setListings(products || []);
      }


      setLoading(false);
    };


    loadDashboard();
  }, [router]);


  const markAsSoldOut = async (listingId: string) => {
    const confirmed = window.confirm(
      "Mark this item as sold out? This cannot be undone. You will need to create a new listing if you want to sell it again."
    );


    if (!confirmed) return;


    setMarkingSoldOut(listingId);
    setMessage("");


    try {
      const supabase = createSupabaseClient();


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const userId = session?.user?.id;


      if (!userId) {
        setMessage("Please sign in again.");
        return;
      }


      const { error } = await supabase
        .from("products")
        .update({ status: "sold_out" })
        .eq("id", listingId)
        .eq("seller_id", userId);


      if (error) {
        setMessage(error.message || "We could not mark this item as sold out.");
        return;
      }


      setListings((currentListings) =>
        currentListings.map((listing) =>
          listing.id === listingId
            ? { ...listing, status: "sold_out" }
            : listing
        )
      );


      setMessage("Item marked as sold out.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setMarkingSoldOut(null);
    }
  };


  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--pm-bg)",
          color: "var(--pm-muted)",
        }}
      >
        Loading your seller dashboard...
      </div>
    );
  }


  const verificationStatus = seller?.verification_status || "pending";


  const statusColors: Record<string, { background: string; color: string }> = {
    approved: { background: "#e6f7ee", color: "#0f7a4d" },
    needs_review: { background: "#fff6e0", color: "#a06b00" },
    rejected: { background: "#ffe8e8", color: "#c0392b" },
    pending: { background: "var(--pm-bg)", color: "var(--pm-muted)" },
  };


  const statusText: Record<string, string> = {
    approved: "approved",
    needs_review: "under review",
    rejected: "rejected",
    pending: "pending",
  };


  const card: React.CSSProperties = {
    background: "var(--pm-surface)",
    borderRadius: 20,
    padding: 22,
    boxShadow: "var(--pm-shadow)",
    border: "1px solid var(--pm-border)",
  };


  const pill: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  };


  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pm-bg)",
        color: "var(--pm-text)",
        fontFamily: "Plus Jakarta Sans, Arial, sans-serif",
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
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>
              Seller Dashboard
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--pm-muted)", fontSize: 14 }}>
              PadiMarket Seller
            </p>
          </div>


                   <nav
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Link
              href="/seller/orders"
              style={{ ...pill, background: "var(--pm-bg)", color: "var(--pm-text)" }}
            >
              Orders
            </Link>


            <Link
              href="/seller/withdrawals"
              style={{ ...pill, background: "var(--pm-bg)", color: "var(--pm-text)" }}
            >
              Withdrawals
            </Link>


            <Link
              href="/seller/boost"
              style={{ ...pill, background: "var(--pm-bg)", color: "var(--pm-text)" }}
            >
              Boost
            </Link>


            <Link
              href="/"
              style={{
                ...pill,
                background: "var(--pm-bg)",
                color: "var(--pm-text)",
                border: "1px solid var(--pm-border)",
              }}
            >
              ← Back to home
            </Link>
          </nav>
        </div>
      </header>


      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "28px 20px 60px",
        }}
      >
        <div style={card}>
          <p style={{ margin: 0, color: "var(--pm-muted)", fontSize: 14 }}>
            Verification:{" "}
            <strong style={{ color: "var(--pm-text)" }}>
              {statusText[verificationStatus]}
            </strong>
          </p>


          {verificationStatus === "approved" ? (
            <p style={{ margin: "8px 0 0", fontSize: 15 }}>
              You are a verified seller. Buyers see your verified badge.
            </p>
          ) : (
            <p style={{ margin: "8px 0 0", fontSize: 15 }}>
              Your seller verification is {statusText[verificationStatus]}.
            </p>
          )}
        </div>


        {message && (
          <div
            style={{
              marginTop: 20,
              background: "var(--pm-surface)",
              border: "1px solid var(--pm-border)",
              borderRadius: 16,
              padding: 16,
              fontWeight: 700,
              color: "#b7791f",
            }}
          >
            {message}
          </div>
        )}


        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              My listings
            </h2>


            <Link
             href="/sell"
              style={{ ...pill, background: "#0b9e77", color: "#ffffff" }}
            >
              Add new listing
            </Link>
          </div>


          {listings.length === 0 ? (
            <div style={card}>
              <p style={{ margin: 0, color: "var(--pm-muted)" }}>
                You have not listed any products yet.
              </p>


              <Link
                href="/seller/products"
                style={{
                  ...pill,
                  background: "#0b9e77",
                  color: "#ffffff",
                  marginTop: 16,
                }}
              >
                List your first item
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {listings.map((listing) => {
                const isSoldOut = listing.status === "sold_out";


                return (
                  <div key={listing.id} style={card}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 800,
                          lineHeight: 1.4,
                        }}
                      >
                        {listing.title}
                      </h3>


                      {isSoldOut && (
                        <span
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background: "#ffe8e8",
                            color: "#c0392b",
                          }}
                        >
                          Sold out
                        </span>
                      )}
                    </div>


                    <p
                      style={{
                        margin: "10px 0 0",
                        color: "var(--pm-muted)",
                        fontSize: 14,
                      }}
                    >
                      ₦{Number(listing.price || 0).toLocaleString("en-NG")}
                      {listing.location ? ` · ${listing.location}` : ""}
                    </p>


                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        marginTop: 18,
                        flexWrap: "wrap",
                      }}
                    >
                      <Link
                        href={`/product/${listing.id}`}
                        style={{
                          ...pill,
                          background: "var(--pm-bg)",
                          color: "var(--pm-text)",
                        }}
                      >
                        View listing
                      </Link>


                      {!isSoldOut && (
                        <button
                          onClick={() => markAsSoldOut(listing.id)}
                          disabled={markingSoldOut === listing.id}
                          style={{
                            ...pill,
                            border: "none",
                            background:
                              markingSoldOut === listing.id ? "#6b7280" : "#c0392b",
                            color: "#ffffff",
                            cursor:
                              markingSoldOut === listing.id ? "wait" : "pointer",
                          }}
                        >
                          {markingSoldOut === listing.id
                            ? "Marking..."
                            : "Mark as sold out"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}