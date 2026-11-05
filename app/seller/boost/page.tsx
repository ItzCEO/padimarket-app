"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";


type Listing = {
  id: string;
  title: string;
  price: number;
  location?: string | null;
  status?: string | null;
  boosted_until?: string | null;
};


export default function SellerBoostPage() {
  const router = useRouter();


  const [loading, setLoading] = useState(true);
  const [boostCredits, setBoostCredits] = useState(0);
  const [listings, setListings] = useState<Listing[]>([]);
  const [creditsToBuy, setCreditsToBuy] = useState(1);
  const [message, setMessage] = useState("");
  const [boostingListingId, setBoostingListingId] = useState<string | null>(null);


  const PRICE_PER_CREDIT = 500;
  const BOOST_DAYS = 3;


  useEffect(() => {
    const loadBoostPage = async () => {
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


      setBoostCredits(data.seller?.boost_credits || 0);


      const { data: products, error } = await supabase
        .from("products")
        .select(
          "id, title, price, location, status, boosted_until"
        )
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });


      if (error) {
        console.error("Error loading listings for Boost:", error);
      } else {
        setListings(products || []);
      }


      setLoading(false);
    };


    loadBoostPage();
  }, [router]);


  const buyCredits = async () => {
    setMessage("");


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


      const response = await fetch("/api/boost/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          credits: creditsToBuy,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "We could not start your Boost payment.");
        return;
      }


      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
  };


  const useBoostCredit = async (listingId: string) => {
    const confirmed = window.confirm(
      "Use 1 Boost credit to boost this listing for 3 days?"
    );


    if (!confirmed) return;


    setBoostingListingId(listingId);
    setMessage("");


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


      const response = await fetch("/api/boost/use", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId,
        }),
      });


      const data = await response.json();


      if (!response.ok) {
        setMessage(data.error || "We could not boost this listing.");
        return;
      }


      setBoostCredits(data.boostCredits);


      setListings((currentListings) =>
        currentListings.map((listing) =>
          listing.id === listingId
            ? { ...listing, boosted_until: data.boostedUntil }
            : listing
        )
      );


      setMessage("This listing is now boosted for 3 days.");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setBoostingListingId(null);
    }
  };


  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--pm-bg)",
          color: "var(--pm-muted)",
        }}
      >
        Loading Boost...
      </div>
    );
  }


  const card: React.CSSProperties = {
    background: "var(--pm-surface)",
    borderRadius: 20,
    padding: 22,
    border: "1px solid var(--pm-border)",
    boxShadow: "var(--pm-shadow)",
  };


  const pill: React.CSSProperties = {
    display: "inline-block",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
    textDecoration: "none",
  };


  const totalPrice = creditsToBuy * PRICE_PER_CREDIT;


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
            maxWidth: 900,
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
              Boost
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--pm-muted)", fontSize: 14 }}>
              Boost your listings to appear higher in search results
            </p>
          </div>


          <Link
            href="/seller/dashboard"
            style={{
              ...pill,
              background: "var(--pm-bg)",
              color: "var(--pm-text)",
              border: "1px solid var(--pm-border)",
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
          display: "grid",
          gap: 20,
        }}
      >
        {message && (
          <div
            style={{
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


        {/* Boost credits */}
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Your Boost credits
          </h2>


          <p style={{ margin: "10px 0 0", fontSize: 32, fontWeight: 800 }}>
            {boostCredits}
          </p>


          <p style={{ margin: "6px 0 0", color: "var(--pm-muted)", fontSize: 14 }}>
            1 Boost credit boosts 1 listing for 3 days.
          </p>
        </div>


        {/* Buy credits */}
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Buy Boost credits
          </h2>


          <p style={{ margin: "10px 0 0", color: "var(--pm-muted)", fontSize: 14 }}>
            Each Boost credit costs ₦500 and boosts one listing for 3 days.
          </p>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 20,
            }}
          >
            <button
              onClick={() =>
                setCreditsToBuy((current) => Math.max(1, current - 1))
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid var(--pm-border)",
                background: "var(--pm-bg)",
                color: "var(--pm-text)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              -
            </button>


            <div
              style={{
                minWidth: 70,
                textAlign: "center",
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              {creditsToBuy}
            </div>


            <button
              onClick={() =>
                setCreditsToBuy((current) => current + 1)
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 999,
                border: "1px solid var(--pm-border)",
                background: "var(--pm-bg)",
                color: "var(--pm-text)",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>


          <p style={{ margin: "18px 0 0", fontWeight: 800, fontSize: 18 }}>
            Total: ₦{totalPrice.toLocaleString("en-NG")}
          </p>


          <button
            onClick={buyCredits}
            style={{
              width: "100%",
              marginTop: 16,
              padding: "14px 18px",
              borderRadius: 999,
              border: "none",
              background: "#0b9e77",
              color: "#ffffff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Pay ₦{totalPrice.toLocaleString("en-NG")} with Paystack
          </button>
        </div>


        {/* Listings */}
        <div style={card}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            Boost a listing
          </h2>


          {listings.length === 0 ? (
            <p style={{ margin: "12px 0 0", color: "var(--pm-muted)" }}>
              You have no listings yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {listings.map((listing) => {
                const isSoldOut = listing.status === "sold_out";


                const boostEndDate = listing.boosted_until
                  ? new Date(listing.boosted_until)
                  : null;


                const isCurrentlyBoosted =
                  boostEndDate && boostEndDate > new Date();


                return (
                  <div
                    key={listing.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 14,
                      flexWrap: "wrap",
                      background: "var(--pm-bg)",
                      border: "1px solid var(--pm-border)",
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: 800 }}>
                        {listing.title}
                      </p>


                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          color: "var(--pm-muted)",
                        }}
                      >
                        ₦{Number(listing.price).toLocaleString("en-NG")}
                        {listing.location ? ` · ${listing.location}` : ""}
                      </p>


                      {isCurrentlyBoosted && (
                        <p
                          style={{
                            margin: "6px 0 0",
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#0b9e77",
                          }}
                        >
                          Boosted until{" "}
                          {boostEndDate?.toLocaleString("en-NG", {
  timeZone: "Africa/Lagos",
  dateStyle: "medium",
  timeStyle: "short",
})}
                        </p>
                      )}
                    </div>


                    {isSoldOut ? (
                      <span
                        style={{
                          padding: "8px 14px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          background: "#ffe8e8",
                          color: "#c0392b",
                        }}
                      >
                        Sold out
                      </span>
                    ) : isCurrentlyBoosted ? (
                      <span
                        style={{
                          padding: "8px 14px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 800,
                          background: "#e6f7ee",
                          color: "#0f7a4d",
                        }}
                      >
                        Boost active
                      </span>
                    ) : (
                      <button
                        onClick={() => useBoostCredit(listing.id)}
                        disabled={
                          boostingListingId === listing.id ||
                          boostCredits < 1
                        }
                        style={{
                          ...pill,
                          border: "none",
                          background:
                            boostingListingId === listing.id || boostCredits < 1
                              ? "#6b7280"
                              : "#0b9e77",
                          color: "#ffffff",
                          cursor:
                            boostingListingId === listing.id || boostCredits < 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {boostingListingId === listing.id
                          ? "Boosting..."
                          : "Use 1 Boost credit"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}