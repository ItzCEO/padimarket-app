"use client";


import { useCart } from "@/app/cart-context";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Suspense } from "react";


type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  condition: string | null;
  size: string | null;
  quantity: number | null;
  location: string | null;
  seller_name: string | null;
  seller_id: string | null;
  image_url: string | null;
  status?: string | null;
};


function makeSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function ProductDetails() {
  const params = useParams();
  const slug = String(params.slug || "");
  const { addToCart, cart } = useCart();


  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState("");
  const [showReportForm, setShowReportForm] = useState(false);
const [reportReason, setReportReason] = useState("");
const [reportDetails, setReportDetails] = useState("");
const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isFavourite, setIsFavourite] = useState(false);
const [favouriteLoading, setFavouriteLoading] = useState(false);

async function toggleFavourite() {
  if (!product || favouriteLoading) return;

  setFavouriteLoading(true);

  const supabase = createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setNotice("Please sign in to save products.");
    setFavouriteLoading(false);
    return;
  }

  if (isFavourite) {
    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", product.id);

    if (!error) {
      setIsFavourite(false);
      setNotice("Removed from favourites.");
    }
  } else {
    const { error } = await supabase.from("favourites").insert({
      user_id: user.id,
      product_id: product.id,
    });

    if (!error) {
      setIsFavourite(true);
      setNotice("Saved to favourites.");
    }
  }

  setFavouriteLoading(false);
}

async function submitReport() {
  if (!product || !reportReason) {
    setNotice("Please choose a reason for your report.");
    return;
  }

  setIsSubmittingReport(true);

  const supabase = createSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    setNotice("Please sign in to report this listing.");
    setIsSubmittingReport(false);
    return;
  }

  const { error } = await supabase.from("listing_reports").insert({
    product_id: product.id,
    reporter_id: user.id,
    reason: reportReason,
    details: reportDetails || null,
  });

  setIsSubmittingReport(false);

  if (error) {
    setNotice("Unable to submit your report. Please try again.");
    return;
  }

  setShowReportForm(false);
  setReportReason("");
  setReportDetails("");
  setNotice("Thank you. Your report has been submitted for review.");
}
  useEffect(() => {
    async function loadProduct() {
      const supabase = createSupabaseClient();


      const { data, error } = await supabase
        .from("products")
                .select(
          "id, title, description, price, category, condition, size, quantity, location, seller_name, seller_id, image_url, status"
        );


      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }


      const match =
  data?.find((item: Product) => item.id === slug) ||
  data?.find(
    (item: Product) => makeSlug(item.title) === slug
  );


      if (match) {
  setProduct(match);
  const { data: similarData } = await supabase
  .from("products")
  .select(
    "id, title, description, price, category, condition, size, quantity, location, seller_name, seller_id, image_url"
  )
  .eq("category", match.category)
  .neq("id", match.id)
  .gt("quantity", 0)
  .limit(20);

const nearbyItems = (similarData || [])
  .sort((a: Product, b: Product) => {
    if (a.location === match.location && b.location !== match.location) {
      return -1;
    }

    if (b.location === match.location && a.location !== match.location) {
      return 1;
    }

    return 0;
  })
  .slice(0, 6);

setSimilarProducts(nearbyItems);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: favouriteData } = await supabase
      .from("favourites")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", match.id)
      .maybeSingle();

    setIsFavourite(Boolean(favouriteData));
  }
} else {
  setNotFound(true);
}


      setLoading(false);
    }


    loadProduct();
  }, [slug]);


  if (loading) {
    return (
      <main className="product-page">
        <div className="shell">
          <p>Loading product...</p>
        </div>
      </main>
    );
  }

  const isSoldOut =
    product?.status === "sold_out" || (product?.quantity || 0) === 0;

  if (notFound || !product) {
    return (
      <main className="product-page">
        <div className="shell">
          <p>This listing could not be found.</p>
          <a className="pill ghost" href="/">
            ← Back home
          </a>
        </div>
      </main>
    );
  }


  return (
    <main className="product-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />


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


        <div className="top-actions">
          <a className="pill ghost" href="/">
            ← Back home
          </a>


          <a className="pill primary" href="/cart">
            Cart ({cart.length})
          </a>
        </div>
      </header>


      <div className="shell">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>{product.category || "General"}</span>
          <span>/</span>
          <span className="current">{product.title}</span>
        </div>


        <section className="product-layout">
          <div className="gallery clay">
            <div className="main-image">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              ) : (
                <span>🛍️</span>
              )}
            </div>


            <div className="gallery-note">
              Product photo provided by the seller.
            </div>
          </div>


          <div className="details clay">
            <span className="condition">
              {product.condition || "Good"}
            </span>


            <h1>{product.title}</h1>


            <div className="price">
              ₦{Number(product.price).toLocaleString("en-NG")}
            </div>


            <div className="location">
              📍 {product.location || "Lagos"}
            </div>

            <button
  className="favourite-button"
  onClick={toggleFavourite}
  disabled={favouriteLoading}
>
  {isFavourite ? "❤️ Saved" : "🤍 Save"}
</button>


            <div className="spec-grid">
              <div className="spec">
                <span>Condition</span>
                <strong>{product.condition || "Good"}</strong>
              </div>


              <div className="spec">
                <span>Category</span>
                <strong>{product.category || "General"}</strong>
              </div>


              <div className="spec">
                <span>Size</span>
                <strong>{product.size || "Not specified"}</strong>
              </div>


              <div className="spec">
                <span>Available</span>
                <strong>{product.quantity || 1}</strong>
              </div>
            </div>


            <div className="description">
              <h2>Description</h2>
              <p>
                {product.description || "No description provided."}
              </p>
            </div>


           {product.seller_id ? (
  <Link
    href={`/seller/${product.seller_id}`}
    className="seller-card"
  >
    <div className="seller-avatar" aria-hidden="true">
      {(product.seller_name || "P").charAt(0)}
    </div>

    <div>
      <strong>{product.seller_name || "PadiMarket seller"}</strong>
      <span>View seller profile →</span>
    </div>
  </Link>
) : (
  <div className="seller-card">
    <div className="seller-avatar" aria-hidden="true">
      {(product.seller_name || "P").charAt(0)}
    </div>

    <div>
      <strong>{product.seller_name || "PadiMarket seller"}</strong>
      <span>PadiMarket seller</span>
    </div>
  </div>
)}

<div className="single-seller-cart-notice">
  <strong>One seller per cart</strong>
  <p>
    You can buy multiple items from the same seller in one checkout. To buy
    from a different seller, clear your current cart first.
  </p>
</div>
                        <button
              className="add-to-cart-btn"
              disabled={isSoldOut}
              onClick={() =>
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: Number(product.price),
                  image_url: product.image_url,
                  stock: Number(product.quantity || 1),
                seller_id: product.seller?.id || product.seller_id || "",
seller_name: product.seller?.store_name || product.seller_name || null,
                })
              }
            >
                           {isSoldOut ? "Sold Out" : "Add to Cart"}
            </button>

            <div className="action-buttons">
              <Link
  className="pill primary large"
  href={`/chat/${product.id}`}
>
  Message seller
</Link>


              <button
  className="pill ghost"
  onClick={() => setShowReportForm(true)}
>
  Report listing
</button>
            </div>


            <div className="safety-note">
              For your safety, meet in a public place, inspect the item before
              payment, and never share your bank details or verification codes.
            </div>
          </div>
        </section>


<section className="similar clay">
  <h2>Similar items nearby</h2>
  <p>
    Other available listings in the same category or nearby areas.
  </p>

  {similarProducts.length === 0 ? (
    <p className="similar-empty">
      No similar items are available right now.
    </p>
  ) : (
    <div className="similar-grid">
      {similarProducts.map((item) => (
        <Link
  key={item.id}
  href={`/product/${item.id}`}
  className="similar-card"
>
          <div className="similar-image">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} />
            ) : (
              <span>🛍️</span>
            )}
          </div>

          <div className="similar-info">
            <h3>{item.title}</h3>
            <p className="similar-price">
              ₦{Number(item.price).toLocaleString("en-NG")}
            </p>
            <p className="similar-location">
              📍 {item.location || "Location not specified"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )}
</section>
      </div>

{showReportForm && (
  <div className="report-overlay">
    <div className="report-popup">
      <h3>Report this listing</h3>
      <p>
        Tell us what is wrong with this listing. Your report will be reviewed
        by the PadiMarket safety team.
      </p>

      <label className="report-label">Reason</label>
      <select
        className="report-select"
        value={reportReason}
        onChange={(event) => setReportReason(event.target.value)}
      >
        <option value="">Choose a reason</option>
        <option value="Scam or fraud">Scam or fraud</option>
        <option value="Fake or counterfeit item">Fake or counterfeit item</option>
        <option value="Wrong description or photos">Wrong description or photos</option>
        <option value="Prohibited item">Prohibited item</option>
        <option value="Misleading price">Misleading price</option>
        <option value="Suspicious seller">Suspicious seller</option>
        <option value="Other">Other</option>
      </select>

      <label className="report-label">Additional details</label>
      <textarea
        className="report-textarea"
        placeholder="Optional: explain the problem"
        value={reportDetails}
        onChange={(event) => setReportDetails(event.target.value)}
      ></textarea>

      <div className="report-actions">
        <button
          type="button"
          className="report-cancel"
          onClick={() => setShowReportForm(false)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="report-submit"
          onClick={submitReport}
          disabled={isSubmittingReport || !reportReason}
        >
          {isSubmittingReport ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </div>
  </div>
)}
      {notice && (
        <div className="notice clay">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            ✕
          </button>
        </div>
      )}


      <style jsx global>{`
        * {
          box-sizing: border-box;
        }


        body {
          margin: 0;
          background: var(--pm-bg);
          color: var(--pm-text);
          font-family: "Plus Jakarta Sans", Arial, sans-serif;
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
        a:focus-visible {
          outline: 3px solid #12b886;
          outline-offset: 3px;
        }


        .product-page {
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          padding-bottom: 50px;
          color: var(--pm-text);
        }


        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.55;
          pointer-events: none;
        }


        .glow-one {
          width: 480px;
          height: 480px;
          top: -160px;
          right: -120px;
          background: #b8f2de;
        }


        .glow-two {
          width: 430px;
          height: 430px;
          top: 500px;
          left: -170px;
          background: #d9e4ff;
        }


        [data-theme="dark"] .glow-one {
          background: #12463a;
        }


        [data-theme="dark"] .glow-two {
          background: #1d2b45;
        }


        .topbar {
          position: relative;
          z-index: 2;
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          border-radius: 18px;
        }


        .logo-text {
          font-size: 25px;
          font-weight: 800;
          letter-spacing: -1.1px;
        }


        .logo-text span {
          color: #0b9e77;
        }


        .top-actions {
          display: flex;
          gap: 10px;
        }


        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 13px 21px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          transition: transform 0.15s;
        }


        .pill.primary {
          background: linear-gradient(145deg, #17d39a, #0b9e77);
          color: white;
        }


        .pill.primary:hover {
          transform: translateY(-1px);
        }


        .pill.ghost {
          background: var(--pm-surface);
          color: var(--pm-text);
          box-shadow: var(--pm-shadow);
        }


        .pill.large {
          padding: 17px 28px;
          font-size: 15px;
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


        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 9px;
          margin: 8px 0 22px;
          color: var(--pm-muted);
          font-size: 12px;
          font-weight: 600;
        }


        .breadcrumb a {
          color: #0b9e77;
          text-decoration: none;
        }


        .breadcrumb .current {
          color: var(--pm-text);
        }


        .product-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }


        .gallery {
          padding: 26px;
        }


        .main-image {
          display: grid;
          place-items: center;
          height: 770px;
          border-radius: 26px;
          background: var(--pm-bg);
          overflow: hidden;
        }


        .main-image span {
          font-size: 155px;
        }


        .gallery-note {
          margin-top: 18px;
          color: var(--pm-muted);
          font-size: 12px;
          text-align: center;
        }


        .details {
          padding: 34px;
        }


        .condition {
          display: inline-block;
          padding: 8px 13px;
          border-radius: 999px;
          background: #e8fbf4;
          color: #0b7a5d;
          font-size: 11px;
          font-weight: 800;
        }


        [data-theme="dark"] .condition {
          background: #123529;
          color: #7ff0c4;
        }


        h1 {
          margin: 18px 0 12px;
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.15;
          letter-spacing: -1.6px;
          font-weight: 800;
        }


        .price {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -1px;
        }


        .location {
          margin-top: 10px;
          color: var(--pm-muted);
          font-size: 14px;
        }


        .spec-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 24px;
        }


        .spec {
          padding: 16px;
          border-radius: 20px;
          background: var(--pm-bg);
        }


        .spec span {
          display: block;
          margin-bottom: 5px;
          color: var(--pm-muted);
          font-size: 11px;
          font-weight: 700;
        }


        .description {
          margin-top: 26px;
        }


        h2 {
          margin: 0 0 10px;
          font-size: 19px;
        }


        .description p {
          margin: 0;
          color: var(--pm-muted);
          font-size: 14px;
          line-height: 1.8;
        }


        .seller-card {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 26px;
          padding: 17px;
          border-radius: 22px;
          background: var(--pm-bg);
        }


        .seller-avatar {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(145deg, #17d39a, #0b9e77);
          color: white;
          font-size: 20px;
          font-weight: 800;
        }


        .seller-card strong {
          display: block;
          font-size: 15px;
        }


        .seller-card span {
          color: var(--pm-muted);
          font-size: 12px;
        }


        .add-to-cart-btn {
          width: 100%;
          margin-top: 24px;
          padding: 16px;
          border-radius: 999px;
          background: linear-gradient(145deg, #17d39a, #0b9e77);
          color: white;
          font-size: 16px;
          font-weight: 800;
        }


        .add-to-cart-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }


        .action-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }


        .safety-note {
          margin-top: 22px;
          padding: 16px 18px;
          border-radius: 18px;
          background: #e8fbf4;
          color: #0b7a5d;
          font-size: 13px;
          line-height: 1.7;
        }


        [data-theme="dark"] .safety-note {
          background: #123529;
          color: #7ff0c4;
        }


        .similar {
          margin-top: 30px;
          padding: 32px;
        }
          .similar-empty {
  margin-top: 18px !important;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.similar-card {
  display: block;
  overflow: hidden;
  border-radius: 22px;
  background: var(--pm-bg);
  text-decoration: none;
  color: var(--pm-text);
  border: 1px solid var(--pm-border);
}

.similar-image {
  display: grid;
  place-items: center;
  height: 400px;
  padding: 10px;
  background: var(--pm-surface);
  overflow: hidden;
}

.similar-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--pm-surface);
}

.similar-image span {
  font-size: 48px;
}

.similar-info {
  padding: 14px 16px 18px;
}

.similar-info h3 {
  margin: 0 0 6px;
  font-size: 15px;
  line-height: 1.4;
}

.similar-price {
  margin: 0 0 4px;
  font-weight: 800;
  color: #0b9e77;
}

.similar-location {
  margin: 0;
  font-size: 12px;
  color: var(--pm-muted);
}


        .similar p {
          margin: 0;
          color: var(--pm-muted);
          font-size: 14px;
          line-height: 1.7;
        }

.report-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.65);
}

.report-popup {
  width: 100%;
  max-width: 460px;
  padding: 26px;
  border-radius: 24px;
  background: var(--pm-surface);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.report-popup h3 {
  margin: 0 0 10px;
  font-size: 21px;
}

.report-popup p {
  margin: 0 0 18px;
  color: var(--pm-muted);
  font-size: 14px;
  line-height: 1.6;
}

.report-label {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  font-weight: 700;
}

.report-select,
.report-textarea {
  width: 100%;
  margin-bottom: 16px;
  padding: 13px 15px;
  border-radius: 14px;
  border: 1px solid var(--pm-border);
  background: var(--pm-bg);
  color: var(--pm-text);
  font-size: 14px;
  outline: none;
}

.report-textarea {
  min-height: 110px;
  resize: vertical;
}

.report-actions {
  display: flex;
  gap: 10px;
}

.report-cancel,
.report-submit {
  flex: 1;
  padding: 13px 16px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
}

.report-cancel {
  border: 1px solid var(--pm-border);
  background: transparent;
  color: var(--pm-text);
}

.report-submit {
  border: 0;
  background: linear-gradient(145deg, #17d39a, #0b9e77);
  color: white;
}

.report-submit:disabled {
  background: #9ca3af;
  cursor: not-allowed;
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
          width: min(92%, 560px);
          padding: 18px 20px;
          border-radius: 22px;
          background: #172033;
          color: #f3f5f7;
          font-size: 13px;
          line-height: 1.5;
        }


        .notice button {
          margin-left: auto;
          color: inherit;
          padding: 8px;
        }


        @media (max-width: 950px) {
          .product-layout {
            grid-template-columns: 1fr;
          }
        }


        @media (max-width: 650px) {
          .topbar {
            padding: 16px;
          }


          .logo-text {
            font-size: 22px;
          }


          .shell {
            padding: 0 16px;
          }


          .breadcrumb {
            flex-wrap: wrap;
          }


          .gallery,
          .details,
          .similar {
            padding: 22px;
            border-radius: 26px;
          }


          .main-image {
            height: 270px;
          }


          .main-image span {
            font-size: 110px;
          }


          .details {
            padding: 24px;
          }


          .price {
            font-size: 29px;
          }


          .spec-grid {
            grid-template-columns: 1fr 1fr;
          }


          .action-buttons {
            flex-direction: column;
          }


          .action-buttons .pill {
            width: 100%;
          }


          .notice {
            bottom: 20px;
          }
        }
      `}</style>
    </main>
  );
}
export default function ProductPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading product...</p>}>
      <ProductDetails />
    </Suspense>
  );
}