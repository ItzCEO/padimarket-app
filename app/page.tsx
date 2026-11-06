"use client";

import { useCart } from "@/app/cart-context";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { useTheme } from "../context/ThemeContext";

const categories = [
  { icon: "📚", name: "Books & School", tint: "#e8f0ff" },
  { icon: "👕", name: "Fashion", tint: "#ffe8ef" },
  { icon: "📱", name: "Electronics", tint: "#e6f7f2" },
  { icon: "🛋️", name: "Home & Living", tint: "#fff3e2" },
  { icon: "🧸", name: "Children's Items", tint: "#f0e9ff" },
  { icon: "🍳", name: "Household", tint: "#e9f4e5" },
];

type Product = {
  id: string;
  title: string;
  price: number;
  location: string | null;
  condition?: string | null;
  category?: string | null;
  image_url?: string | null;
  status?: string | null;
  boosted_until?: string | null;
  seller?: {
    id?: string;
    full_name?: string | null;
    shop_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

function makeSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Home() {
  const { cart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const [notice, setNotice] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showPadiIntro, setShowPadiIntro] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [search, setSearch] = useState("");
  const [selectedLga, setSelectedLga] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerForm, setSellerForm] = useState({
    fullName: "",
    phone: "",
    idType: "",
    idNumber: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [idImage, setIdImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [idPreview, setIdPreview] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const listingsRef = useRef<HTMLDivElement>(null);
  const [sellerVerification, setSellerVerification] = useState("");
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
const [searchQuery, setSearchQuery] = useState("");
const [suggestions, setSuggestions] = useState<
  { id: string; title: string; price: number }[]
>([]);
const [showSuggestions, setShowSuggestions] = useState(false);
const [notificationsEnabled, setNotificationsEnabled] = useState(false);
async function togglePushNotifications() {
  if (notificationsEnabled) {
    await disablePushNotifications();
  } else {
    await enablePushNotifications();
  }
}
const suggestionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
const handleSearchChange = (value: string) => {
  setSearchQuery(value);

  if (suggestionTimer.current) {
    clearTimeout(suggestionTimer.current);
  }

  if (!value.trim()) {
    setSuggestions([]);
    setShowSuggestions(false);
    return;
  }

  suggestionTimer.current = setTimeout(async () => {
    try {
      const response = await fetch(
        `/api/search/suggest?q=${encodeURIComponent(value)}`
      );

      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error("Search suggestion error:", error);
    }
  }, 300);
};

const handleSearchSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  const term = searchQuery.trim();
  setShowSuggestions(false);

  if (!term) return;

  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("products")
    .select(`
  id,
  title,
  price,
  location,
  condition,
  category,
  image_url,
  status,
  boosted_until
`)
    .ilike("title", `%${term}%`)
    .order("boosted_until", {
      ascending: false,
      nullsFirst: false,
    })
    .order("created_at", { ascending: false })
    .limit(12);

   if (error) {
    console.error("Homepage search error:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return;
  }


  setProducts((data as Product[]) || []);
  setHasMore(false);


  setTimeout(() => {
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  }, 100);
};
  useEffect(() => {
  const timer = setTimeout(() => {
    setShowPadiIntro(false);
  }, 10000);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  async function loadProducts() {
    const supabase = createSupabaseClient();

    const { data, error } = await supabase
  .from("products")
  .select(`
    id,
    title,
    price,
    location,
    condition,
    category,
    image_url,
    status,
    boosted_until
  `)
  .order("boosted_until", {
    ascending: false,
    nullsFirst: false,
  })
  .order("created_at", { ascending: false })
  .limit(12);
      .order("boosted_until", {
        ascending: false,
        nullsFirst: false,
      })
      .order("created_at", { ascending: false })
      .limit(12);

    if (error) {
      console.error("Load more products error:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else if (data) {
      setProducts(data as Product[]);
      setHasMore(data.length === 12);
    }

    setLoadingListings(false);
  }

  loadProducts();
}, []);
async function enablePushNotifications() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Your browser does not support push notifications.");
      return;
    }

  

    setNotificationsEnabled(true);
    alert("Notifications enabled.");
  } catch (error) {
    console.error(error);
    alert("Could not enable notifications.");
  }
}

   async function disablePushNotifications() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration) {
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        });

        await subscription.unsubscribe();
      }
    }

    setNotificationsEnabled(false);
    alert("Notifications turned off.");
  } catch (error) {
    console.error(error);
    alert("Could not turn off notifications.");
  }
}

     async function loadMoreProducts() {
  if (loadingMore || !hasMore) return;

    setLoadingMore(true);

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, location, condition, category, image_url")
      .order("created_at", { ascending: false })
      .range(products.length, products.length + 11);

    if (error) {
  console.error("Load products error:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
} else if (data) {
      setProducts((current) => [...current, ...data]);

      if (data.length < 12) {
        setHasMore(false);
      }
    }

    setLoadingMore(false);
  }

   useEffect(() => {
    async function getUser() {
      const supabase = createSupabaseClient();


      const { data } = await supabase.auth.getUser();


      setUserEmail(data.user?.email ?? "");


      if (!data.user) return;


      const {
        data: { session },
      } = await supabase.auth.getSession();


      const token = session?.access_token;


      if (!token) return;


      const response = await fetch("/api/seller/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });


      if (!response.ok) return;


      const result = await response.json();


      if (result.seller?.verification_status === "approved") {
        setIsVerifiedSeller(true);
      }
    }


    getUser();
  }, []);
useEffect(() => {
  if (searchParams.get("openSellerVerification") === "1") {
    setShowSellerForm(true);
  }
}, [searchParams]);

  function preview(feature: string) {
    setNotice(
      `${feature} will be connected in the next build. This is a visual preview.`
    );
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your PadiMarket account? This action cannot be undone."
    );

    if (!confirmed) return;

          const supabase = createSupabaseClient();

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
    if (!token) {
      alert("You must be signed in.");
      return;
    }

    const response = await fetch("/api/delete-account", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error ?? "Unable to delete your account.");
      return;
    }

    await supabase.auth.signOut();

    window.location.href = "/";
  }

  async function handleLogout() {
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const verifySeller = async () => {
    const { fullName, phone, idType, idNumber } = sellerForm;

    if (!fullName || !phone || !idType || !idNumber) {
      setSellerVerification("Please complete all required fields.");
      return;
    }

    if (!profileImage || !idImage) {
      setSellerVerification(
        "Please upload your profile picture and valid ID."
      );
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setSellerVerification("Please enter a valid phone number.");
      return;
    }

    setIsVerifying(true);
    setSellerVerification("");

    try {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("phone", phone);
      formData.append("idType", idType);
      formData.append("idNumber", idNumber);
      formData.append("profileImage", profileImage);
      formData.append("idImage", idImage);

     const supabase = createSupabaseClient();

const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData.session?.access_token;
console.log("SELLER FORM TOKEN:", token ? "FOUND" : "MISSING");

      if (!token) {
        setSellerVerification(
          "Your login session expired. Please refresh the page and try again."
        );
        setIsVerifying(false);
        return;
      }

      const response = await fetch("/api/seller/verify", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
      const data = await response.json();

      if (!response.ok) {
        setSellerVerification(
          data.error || "We could not verify your details right now."
        );
      } else {
        setSellerVerification(data.message);

        if (data.status === "approved") {
          setIsVerifiedSeller(true);
          setTimeout(() => {
            setShowSellerForm(false);
          }, 2500);
        }
      }
    } catch (error) {
      setSellerVerification("Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="pm">
      {showPadiIntro && (
  <div className="padi-intro">
    <img
      src="/padi.png"
      alt="Padi welcoming you to PadiMarket"
      className="padi-intro-character"
    />
  </div>
)}
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <div className="preview-strip">
        <span>PadiMarket preview</span>
        <span className="dot" />
        <span>Sample listings · No live payments</span>
      </div>

      <header className="topbar">
        <a className="logo" href="/" aria-label="PadiMarket home">
          <Image
            className="logo-image"
            src="/logo-new.png"
            alt="PadiMarket logo"
            width={70}
            height={70}
            priority
          />
          <span className="logo-text">
            Padi<span>Market</span>
          </span>
        </a>

        <nav className="desktop-nav">
          <Link href="/favourites" className="nav-icon">
            ❤️
          </Link>

          <Link href="/notifications" className="nav-icon">
            🔔
          </Link>

          <a href="/help">Help</a>
        </nav>

        <div className="top-actions">
          <Link href="/messages" className="pill ghost">
            💬 Messages
          </Link>

          <a className="footer-cart-link" href="/cart">
            <svg
              className="footer-cart-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>

            <span>Cart ({cart.length})</span>
          </a>

          <button
            className="pill ghost"
            onClick={() => setShowSettings(true)}
          >
            Settings
          </button>

          {isVerifiedSeller ? (
           <a className="pill primary" href="/seller/dashboard">
  Seller Dashboard
</a>
          ) : (
            <button
              className="pill primary"
              onClick={() => setShowSellerForm(true)}
            >
              Become a seller
            </button>
          )}
        </div>
      </header>

      <div className="shell">
        <section className="hero clay">
          <div className="hero-copy">
            <div className="badge">
              <span className="badge-dot" />
              Your community marketplace
            </div>

            <h1>
              Discover more.
              <br />
              <span className="accent">Right here on PadiMarket.</span>
            </h1>

            <p>
              From books that inspire to shoes that take you places, PadiMarket
              opens the door to exciting finds, everyday essentials, and
              connections that bring communities closer.
            </p>

           <form
  className="search clay-inset"
  onSubmit={handleSearchSubmit}
  style={{ position: "relative" }}
>
             <span className="search-icon" aria-hidden="true">
  ⌕
</span>
<input
  aria-label="Search products"
  placeholder="Search books, furniture, fashion…"
  value={searchQuery}
  onChange={(event) => handleSearchChange(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }}
  onFocus={() => {
    if (suggestions.length > 0) setShowSuggestions(true);
  }}
  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
/>

{suggestions.length > 0 && showSuggestions && (
  <div
    style={{
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
        background: "var(--pm-surface, #ffffff)",
      border: "1px solid var(--pm-border, #e5e7eb)",
      borderRadius: 12,
      marginTop: 6,
      zIndex: 50,
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    }}
  >
    {suggestions.map((item) => (
      <button
        key={item.id}
        type="button"
        onMouseDown={() => {
  setShowSuggestions(false);
  router.push(`/product/${item.id}`);
}}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "12px 16px",
         background: "var(--pm-surface, #ffffff)",
          color: "var(--pm-text, #0f172a)",
          border: "none",
          borderBottom: "1px solid var(--pm-border, #f1f5f9)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontWeight: 600 }}>{item.title}</span>
        <span style={{ color: "var(--pm-muted, #64748b)" }}>
          ₦{Number(item.price).toLocaleString("en-NG")}
        </span>
      </button>
    ))}
  </div>
)}

<button className="pill primary" type="submit">
  Search
</button>
</form>

            
          </div>

          <div className="hero-visual">
         <div className="hero-card clay padi-card">
  <img
    src="/padi.png"
    alt="Padi welcoming you to PadiMarket"
    className="padi-character"
  />
</div>
          </div>
        </section>

                <section className="section">
          <div className="section-head">
            <div>
              <h2>Explore by category</h2>
              <p>Find something useful for your everyday life.</p>
            </div>
          </div>

          <div className="categories">
           <button
  className={`category clay ${
    selectedCategory === "" ? "category-selected" : ""
  }`}
  onClick={() => setSelectedCategory("")}
>
  <span className="category-icon">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  </span>

  <span>All</span>
</button>

{categories.map((category) => (
  <button
    key={category.name}
    className={`category clay ${
      selectedCategory === category.name ? "category-selected" : ""
    }`}
    onClick={() => {
      setSelectedCategory(category.name);
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }}
  >
    <span className="category-icon">{category.icon}</span>
    <span>{category.name}</span>
  </button>
))}
          </div>
        </section>

        <section className="section" id="products">
          <div className="section-head">
            <div>
              <h2>Discover around Lagos</h2>
              <p>Items recently listed by sellers on PadiMarket.</p>
            </div>
            <span className="mini-label">Live listings</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="lga-search"
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Search by LGA
            </label>

            <input
  id="lga-search"
  list="lga-options"
  value={selectedLga}
  onChange={(event) => setSelectedLga(event.target.value)}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      document
        .getElementById("products")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }}
  placeholder="Type or select an LGA"
  style={{
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    fontSize: 15,
  }}
/>

            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory("");
                  document
                    .getElementById("products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  marginBottom: 16,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid var(--pm-border)",
                  background: "var(--pm-surface)",
                  color: "var(--pm-text)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Clear category filter: {selectedCategory} ✕
              </button>
            )}

            <datalist id="lga-options">
              <option value="Agege" />
              <option value="Ajeromi-Ifelodun" />
              <option value="Alimosho" />
              <option value="Amuwo-Odofin" />
              <option value="Apapa" />
              <option value="Badagry" />
              <option value="Epe" />
              <option value="Eti-Osa" />
              <option value="Ibeju-Lekki" />
              <option value="Ifako-Ijaiye" />
              <option value="Ikeja" />
              <option value="Ikorodu" />
              <option value="Kosofe" />
              <option value="Lagos Island" />
              <option value="Lagos Mainland" />
              <option value="Mushin" />
              <option value="Ojo" />
              <option value="Oshodi-Isolo" />
              <option value="Shomolu" />
              <option value="Surulere" />
            </datalist>
          </div>

          <div
  ref={listingsRef}
  className="products"
>
            {loadingListings && <p>Loading listings...</p>}

            {!loadingListings && products.length === 0 && searchQuery.trim() !== "" && (
  <p style={{ fontWeight: 600 }}>
    No listings found for “{searchQuery.trim()}”. Try another item name.
  </p>
)}


{!loadingListings && products.length === 0 && searchQuery.trim() === "" && (
  <p>
    No listings yet. Be the first to sell something on PadiMarket.
  </p>
)}
            {!loadingListings &&
  products.length > 0 &&
  products.filter((product) => {
    const matchesCategory =
      selectedCategory === "" ||
      product.category === selectedCategory;


    if (!matchesCategory) return false;


    if (selectedLga === "") return true;


    const productLga = String(product.location ?? "").toLowerCase();


    return productLga.includes(selectedLga.toLowerCase());
  }).length === 0 && (
    <p style={{ fontWeight: 600 }}>
      No listings found. Try a different item name, category, or LGA.
    </p>
  )}

            {products
              .filter((product) => {
                const matchesCategory =
                  selectedCategory === "" ||
                  product.category === selectedCategory;

                if (!matchesCategory) return false;

                if (selectedLga === "") return true;

                const productLga = String(
                  product.location ?? ""
                ).toLowerCase();

                return productLga.includes(selectedLga.toLowerCase());
              })
              .map((product) => (
                <Link
                  href={`/product/${makeSlug(product.title)}`}
                  key={product.id}
                  className="product-link"
                >
                  <article className="product clay">
                    <div
                      className="product-media"
                      style={{ background: "#e6f7f2" }}
                    >
                      <span className="condition">
                        {product.condition || "Good"}
                      </span>

                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="product-photo"
                        />
                      ) : (
                        <span className="product-emoji">🛍️</span>
                      )}
                    </div>

                    <div className="product-body">
                      <span className="location">
                        📍 {product.location || "Lagos"}
                      </span>

                      <h3>
  {product.boosted_until &&
    new Date(product.boosted_until) > new Date() && (
      <span
        style={{
          color: "#f59e0b",
          marginRight: 4,
        }}
        title="Boosted listing"
      >
        ⚡
      </span>
    )}
  {product.title}
</h3>

                      <div className="product-foot">
                        <strong>
                          ₦{Number(product.price).toLocaleString("en-NG")}
                        </strong>
                        <span className="view-button">View →</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
          </div>

          {hasMore && (
            <div className="load-more-wrapper">
              <button
                className="pill primary"
                onClick={loadMoreProducts}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more products"}
              </button>
            </div>
          )}
        </section>

        <section className="community clay">
          <div>
            <span className="mini-label">
              Your community · Your marketplace
            </span>
            <h2>Whatever you're looking for, start here.</h2>
            <p>
              From books that inspire to shoes that take you places, discover
              products, find great deals, and connect with your community on
              PadiMarket.
            </p>
          </div>

          <button
            className="pill primary"
            onClick={() => setShowSellerForm(true)}
          >
            Become a seller
          </button>
        </section>

        <footer className="footer">
  <div className="footer-brand">
    <Image
      className="footer-logo"
      src="/logo-new.png"
      alt="PadiMarket logo"
      width={36}
      height={36}
    />

    <div>
      <strong>PadiMarket</strong>
      <span>Peer-to-peer community</span>
    </div>
  </div>

  <div className="footer-links">
  <Link href="/help">Help support</Link>

  <Link href="/help#safety">Safety</Link>

  <Link href="/terms">Terms</Link>
</div>

  <p className="footer-copyright">
    © 2026 PadiMarket. Lagos, Nigeria.
  </p>
</footer>
      </div>

      {showSellerForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(9, 14, 20, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 540,
              background: "var(--pm-surface)",
              borderRadius: 24,
              padding: 24,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22 }}>
                Seller verification
              </h2>
              <button
                onClick={() => setShowSellerForm(false)}
                aria-label="Close seller verification"
                style={{ fontSize: 20 }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "var(--pm-muted)", marginTop: 0 }}>
              Upload your details and valid ID to complete seller verification.
            </p>

            <div style={{ display: "grid", gap: 14 }}>
              <input
                placeholder="Full name"
                value={sellerForm.fullName}
                onChange={(event) =>
                  setSellerForm({
                    ...sellerForm,
                    fullName: event.target.value,
                  })
                }
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--pm-border)",
                }}
              />

              <input
                placeholder="Phone number"
                value={sellerForm.phone}
                onChange={(event) =>
                  setSellerForm({
                    ...sellerForm,
                    phone: event.target.value,
                  })
                }
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--pm-border)",
                }}
              />

              <select
                value={sellerForm.idType}
                onChange={(event) =>
                  setSellerForm({
                    ...sellerForm,
                    idType: event.target.value,
                  })
                }
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--pm-border)",
                }}
              >
                <option value="">Select ID type</option>
                <option value="National ID">National ID</option>
                <option value="Voter's Card">Voter's Card</option>
                <option value="Driver's Licence">Driver's Licence</option>
                <option value="International Passport">
                  International Passport
                </option>
              </select>

              <input
                placeholder="ID number"
                value={sellerForm.idNumber}
                onChange={(event) =>
                  setSellerForm({
                    ...sellerForm,
                    idNumber: event.target.value,
                  })
                }
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid var(--pm-border)",
                }}
              />

              <label style={{ fontWeight: 700, fontSize: 14 }}>
                Upload profile picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setProfileImage(file);
                      setProfilePreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ display: "block", marginTop: 8 }}
                />
              </label>

              {profilePreview && (
                <img
                  src={profilePreview}
                  alt="Profile preview"
                  style={{
                    width: 90,
                    height: 90,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}

              <label style={{ fontWeight: 700, fontSize: 14 }}>
                Upload valid ID
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setIdImage(file);
                      setIdPreview(URL.createObjectURL(file));
                    }
                  }}
                  style={{ display: "block", marginTop: 8 }}
                />
              </label>

              {idPreview && (
                <img
                  src={idPreview}
                  alt="ID preview"
                  style={{
                    width: "100%",
                    maxHeight: 180,
                    objectFit: "contain",
                    borderRadius: 12,
                  }}
                />
              )}
            </div>

            <button
              onClick={verifySeller}
              disabled={isVerifying}
              style={{
                width: "100%",
                marginTop: 18,
                padding: "14px 18px",
                borderRadius: 999,
                background: "#17d39a",
                color: "#04231b",
                fontWeight: 800,
                border: "none",
                cursor: isVerifying ? "wait" : "pointer",
              }}
            >
              {isVerifying
                ? "Verifying your details..."
                : "Submit for verification"}
            </button>

            {sellerVerification && (
              <p
                style={{
                  marginTop: 14,
                  fontWeight: 700,
                  color: sellerVerification
                    .toLowerCase()
                    .includes("approved")
                    ? "#0f9d70"
                    : sellerVerification
                        .toLowerCase()
                        .includes("failed")
                    ? "#e5484d"
                    : "#b7791f",
                }}
              >
                {sellerVerification}
              </p>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div style={settingsStyles.overlay}>
          <div style={settingsStyles.panel}>
            <div style={settingsStyles.header}>
              <h2 style={settingsStyles.title}>Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                style={settingsStyles.closeButton}
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <div style={settingsStyles.profile}>
              <div style={settingsStyles.avatar}>
                {userEmail.slice(0, 1).toUpperCase()}
              </div>

              <div>
                <strong style={settingsStyles.email}>{userEmail}</strong>
                <p style={settingsStyles.profileText}>
                  PadiMarket account
                </p>
              </div>
            </div>

            <Link href="/profile" style={settingsStyles.profileLink}>
              View profile
            </Link>

            <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>
                  Appearance
                </strong>
                <p style={settingsStyles.rowText}>
                  {theme === "light"
                    ? "Light mode is on"
                    : "Dark mode is on"}
                </p>
              </div>

              <button
                onClick={toggleTheme}
                style={{
                  ...settingsStyles.switch,
                  background: theme === "dark" ? "#17d39a" : "#d7dee7",
                }}
                aria-label="Toggle dark mode"
              >
                <span
                  style={{
                    ...settingsStyles.switchCircle,
                    transform:
                      theme === "dark"
                        ? "translateX(22px)"
                        : "translateX(0)",
                  }}
                />
              </button>
            </div>
                        <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>
                  Notifications
                </strong>
                <p style={settingsStyles.rowText}>
                  {notificationsEnabled
                    ? "Notifications are on"
                    : "Notifications are off"}
                </p>
              </div>

              <button
                onClick={togglePushNotifications}
                style={{
                  ...settingsStyles.switch,
                  background: notificationsEnabled ? "#17d39a" : "#d7dee7",
                }}
                aria-label="Toggle notifications"
              >
                <span
                  style={{
                    ...settingsStyles.switchCircle,
                    transform: notificationsEnabled
                      ? "translateX(22px)"
                      : "translateX(0)",
                  }}
                />
              </button>
            </div>

            <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>Account</strong>
                <p style={settingsStyles.rowText}>
                  Sign out of this device.
                </p>
              </div>

              <button
                onClick={handleLogout}
                style={settingsStyles.logoutButton}
              >
                Log out
              </button>
            </div>

            <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>
                  Help & support
                </strong>
                <p style={settingsStyles.rowText}>
                  Get help using PadiMarket.
                </p>
              </div>

              <Link href="/help" className="pill ghost">
                Open
              </Link>
            </div>

            <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>
                  Terms & privacy
                </strong>
                <p style={settingsStyles.rowText}>
                  Read our terms and privacy policy.
                </p>
              </div>

              <Link href="/terms" className="pill ghost">
                Open
              </Link>
            </div>

            <div style={settingsStyles.row}>
              <div>
                <strong style={settingsStyles.rowTitle}>
                  Delete account
                </strong>
                <p style={settingsStyles.rowText}>
                  Permanently delete your PadiMarket account.
                </p>
              </div>

              <button
                className="pill"
                onClick={handleDeleteAccount}
                style={{
                  background: "#e5484d",
                  color: "white",
                  fontWeight: 700,
                  border: "none",
                }}
              >
                Delete
              </button>
            </div>

            <p style={settingsStyles.version}>
              PadiMarket · Version 1.0
            </p>
          </div>
        </div>
      )}

      {notice && (
        <div className="notice clay">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      <style jsx global>{`
        :root {
          --pm-bg: #f3f5f7;
          --pm-surface: #ffffff;
          --pm-text: #172033;
          --pm-muted: #647182;
          --pm-border: #e6ebf1;
          --pm-shadow: 18px 18px 40px rgba(23, 32, 51, 0.09);
        }

        [data-theme="dark"] {
          --pm-bg: #0f151c;
          --pm-surface: #17202b;
          --pm-text: #eef3f8;
          --pm-muted: #a7b4c2;
          --pm-border: #26313d;
          --pm-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
        }

        body {
          margin: 0;
          background: var(--pm-bg);
          color: var(--pm-text);
          font-family: "Plus Jakarta Sans", Arial, sans-serif;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .product-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        * {
          box-sizing: border-box;
        }

        button,
        input {
          font: inherit;
        }

        button {
          cursor: pointer;
          border: 0;
          background: transparent;
        }

        button:focus-visible,
        a:focus-visible,
        input:focus-visible {
          outline: 3px solid #12b886;
          outline-offset: 3px;
        }

        .pm {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          padding-bottom: 40px;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }

        .glow-one {
          width: 520px;
          height: 520px;
          top: -180px;
          right: -120px;
          background: #b8f2de;
        }

        .glow-two {
          width: 460px;
          height: 460px;
          top: 420px;
          left: -180px;
          background: #d9e4ff;
        }

        [data-theme="dark"] .glow-one {
          background: #12463a;
        }

        [data-theme="dark"] .glow-two {
          background: #1d2b45;
        }

        .preview-strip {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 20px;
          background: #0b1117;
          color: #d6fff1;
          font-size: 12px;
          font-weight: 600;
        }

        .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #12b886;
        }

        .topbar {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 28px;
          padding: 22px 28px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--pm-text);
        }

        .logo-image {
          width: 70px;
          height: 70px;
          object-fit: contain;
          border-radius: 14px;
        }

        .logo-text {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1.1px;
        }

        .logo-text span {
          color: #0b9e77;
        }

        .desktop-nav {
          display: flex;
          gap: 6px;
          margin-left: 12px;
        }

        .desktop-nav button,
        .desktop-nav a {
          padding: 11px 15px;
          border-radius: 14px;
          color: var(--pm-muted);
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: 0.2s;
        }

        .desktop-nav button:hover,
        .desktop-nav a:hover {
          background: var(--pm-surface);
          color: var(--pm-text);
          box-shadow: 0 8px 20px rgba(23, 32, 51, 0.08);
        }

        .top-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pill {
          border-radius: 999px;
          padding: 13px 21px;
          font-size: 14px;
          font-weight: 700;
          white-space: nowrap;
          transition: transform 0.15s, box-shadow 0.2s;
        }

        .pill.primary {
          background: linear-gradient(145deg, #17d39a, #0b9e77);
          color: white;
          box-shadow:
            6px 6px 16px rgba(11, 158, 119, 0.25),
            -5px -5px 14px #ffffff;
        }

        .pill.primary:hover {
          transform: translateY(-1px);
        }

        .pill.ghost {
          background: var(--pm-surface);
          color: var(--pm-text);
          box-shadow: var(--pm-shadow);
        }

        .shell {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 28px;
        }

        .clay {
          background: var(--pm-surface);
          border-radius: 32px;
          box-shadow: var(--pm-shadow);
          border: 1px solid var(--pm-border);
        }

        .clay-inset {
          background: var(--pm-bg);
          box-shadow:
            inset 7px 7px 16px rgba(23, 32, 51, 0.08),
            inset -7px -7px 16px #ffffff;
          border: 0;
        }

        [data-theme="dark"] .clay-inset {
          box-shadow:
            inset 7px 7px 16px rgba(0, 0, 0, 0.35),
            inset -7px -7px 16px rgba(255, 255, 255, 0.03);
        }

        .hero {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          align-items: center;
          gap: 36px;
          padding: 52px;
          margin-top: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 15px;
          border-radius: 999px;
          background: #e8fbf4;
          color: #0b7a5d;
          font-size: 12px;
          font-weight: 700;
        }

        [data-theme="dark"] .badge {
          background: #123529;
          color: #7ff0c4;
        }

        .badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #12b886;
        }

        h1 {
          margin: 24px 0 18px;
          font-size: clamp(42px, 5.2vw, 68px);
          line-height: 1.05;
          letter-spacing: -3px;
          font-weight: 800;
        }

        .accent {
          background: linear-gradient(120deg, #0b9e77, #17d39a);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-copy > p {
          max-width: 500px;
          margin: 0;
          color: var(--pm-muted);
          font-size: 16px;
          line-height: 1.8;
        }

        .search {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 580px;
          margin-top: 30px;
          padding: 8px 8px 8px 18px;
          border-radius: 999px;
        }

        .search-icon {
          color: var(--pm-muted);
          font-size: 20px;
        }

        .search input {
          flex: 1;
          min-width: 0;
          border: 0;
          background: transparent;
          color: var(--pm-text);
          font-size: 15px;
        }

        .search input::placeholder {
          color: var(--pm-muted);
          opacity: 1;
        }

        .trust-row {
          display: flex;
          flex-wrap: wrap;
          gap: 26px;
          margin-top: 30px;
        }

        .trust-item {
          display: grid;
          gap: 3px;
        }

        .trust-item strong {
          font-size: 14px;
        }

        .trust-item span {
          color: var(--pm-muted);
          font-size: 12px;
        }

        .hero-visual {
          position: relative;
          min-height: 390px;
        }

        .hero-card {
          position: absolute;
          top: 20px;
          right: 20px;
          width: min(300px, 100%);
          padding: 32px;
          text-align: center;
        }

        .hero-emoji {
          font-size: 92px;
          line-height: 1;
        }

        .hero-card-title {
          margin-top: 20px;
          font-size: 19px;
          font-weight: 800;
        }

        .hero-card-sub {
          margin-top: 7px;
          color: var(--pm-muted);
          font-size: 13px;
        }

        .section {
          margin-top: 46px;
        }

        .section-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }

        h2 {
          margin: 0 0 8px;
          font-size: clamp(24px, 3vw, 32px);
          line-height: 1.25;
          letter-spacing: -1px;
          font-weight: 800;
        }

        .section-head p,
        .community p {
          margin: 0;
          color: var(--pm-muted);
          font-size: 15px;
          line-height: 1.7;
        }

        .categories {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 16px;
        }

        .category {
          display: grid;
          justify-items: center;
          gap: 15px;
          padding: 26px 12px;
          border-radius: 26px;
          color: var(--pm-text);
          font-size: 13px;
          font-weight: 700;
          transition: transform 0.18s;
        }

        .category:hover {
          transform: translateY(-4px);
        }

        .category-icon {
          display: grid;
          place-items: center;
          width: 62px;
          height: 62px;
          border-radius: 21px;
          font-size: 29px;
        }

        .mini-label {
          display: inline-block;
          margin-bottom: 12px;
          color: #0b7a5d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
        }

        [data-theme="dark"] .mini-label {
          color: #7ff0c4;
        }

        .products {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .product {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 28px;
          transition: transform 0.18s;
        }

        .product:hover {
          transform: translateY(-5px);
        }

        .product-media {
          position: relative;
          height: 240px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .product-photo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          background: #f3f6f4;
        }

        .product-body {
          padding: 16px 20px 20px;
          display: block;
        }

        .product-body h3 {
          min-height: 45px;
          margin: 10px 0 15px;
          font-size: 15px;
          line-height: 1.5;
          font-weight: 700;
        }

        .product-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid var(--pm-border);
          padding-top: 15px;
        }

        .condition {
          position: absolute;
          top: 15px;
          left: 15px;
          padding: 7px 11px;
          border-radius: 999px;
          background: var(--pm-surface);
          color: var(--pm-text);
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 6px 16px rgba(23, 32, 51, 0.1);
        }

        .product-emoji {
          font-size: 82px;
        }

        .location {
          color: var(--pm-muted);
          font-size: 11px;
          font-weight: 600;
        }

        .product-foot strong {
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .view-button {
          color: #0b9e77;
          font-size: 13px;
          font-weight: 700;
        }

        .community {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          margin-top: 46px;
          padding: 38px;
        }

        .footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 48px;
          padding: 30px 0 10px;
          color: var(--pm-muted);
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .footer-logo {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 10px;
        }

        .footer-brand strong {
          display: block;
          color: var(--pm-text);
          font-size: 17px;
        }

        .footer-links {
          display: flex;
          gap: 18px;
        }

        .footer-links button {
          color: var(--pm-muted);
          font-size: 13px;
          font-weight: 600;
        }

        .notice {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 30;
          display: flex;
          align-items: center;
          gap: 18px;
          width: min(92%, 540px);
          padding: 18px 20px;
          border-radius: 22px;
          background: #172033;
          color: #f3f5f7;
          font-size: 13px;
          line-height: 1.5;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
        }

        .notice button {
          margin-left: auto;
          color: inherit;
          padding: 8px;
        }

        @media (max-width: 1080px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 36px;
          }

          .hero-visual {
            min-height: 330px;
          }

          .categories {
            grid-template-columns: repeat(3, 1fr);
          }

          .products {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .topbar {
            padding: 14px 16px;
            gap: 10px;
            flex-wrap: wrap;
          }

          .logo-text {
            font-size: 20px;
          }

          .logo-image {
            width: 48px;
            height: 48px;
          }

          .desktop-nav {
            display: flex;
            order: 3;
            width: 100%;
            margin-left: 0;
            justify-content: flex-start;
            gap: 8px;
          }

          .top-actions {
            order: 4;
            width: 100%;
            margin-left: 0;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .shell {
            padding: 0 16px;
          }

          .hero {
            padding: 28px 22px;
            border-radius: 28px;
          }

          h1 {
            font-size: 42px;
            letter-spacing: -2px;
          }

          .hero-visual {
            display: none;
          }

          .section {
            margin-top: 34px;
          }

          .categories {
            gap: 10px;
          }

          .category {
            font-size: 11px;
            padding: 20px 8px;
          }

          .products {
            gap: 12px;
          }

          .footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 350px) {
          .products {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

const settingsStyles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8, 12, 17, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "20px",
  },
  panel: {
    width: "100%",
    maxWidth: "460px",
    background: "var(--pm-surface)",
    color: "var(--pm-text)",
    borderRadius: "26px",
    padding: "26px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
  },
  closeButton: {
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    border: "1px solid var(--pm-border)",
    borderRadius: "12px",
    width: "36px",
    height: "36px",
    fontSize: "16px",
    cursor: "pointer",
  },
  profile: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "18px",
    background: "var(--pm-bg)",
    marginBottom: "14px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "linear-gradient(145deg, #17d39a, #0b9e77)",
    color: "white",
    display: "grid",
    placeItems: "center",
    fontSize: "20px",
    fontWeight: 800,
  },
  email: {
    display: "block",
    fontSize: "15px",
    wordBreak: "break-all",
  },
  profileText: {
    margin: "3px 0 0",
    color: "var(--pm-muted)",
    fontSize: "13px",
  },
  profileLink: {
    display: "block",
    textAlign: "center",
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "999px",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: "14px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "16px 0",
    borderTop: "1px solid var(--pm-border)",
  },
  rowTitle: {
    display: "block",
    fontSize: "15px",
  },
  rowText: {
    margin: "4px 0 0",
    color: "var(--pm-muted)",
    fontSize: "13px",
  },
  switch: {
    width: "52px",
    height: "28px",
    borderRadius: "999px",
    border: "none",
    position: "relative",
    cursor: "pointer",
    padding: 0,
    transition: "background 0.2s ease",
  },
  switchCircle: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#ffffff",
    transition: "transform 0.2s ease",
  },
  logoutButton: {
    background: "#ffe8e8",
    color: "#c0392b",
    border: "none",
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  version: {
    marginTop: "18px",
    textAlign: "center",
    color: "var(--pm-muted)",
       fontSize: "12px",
  },
};
