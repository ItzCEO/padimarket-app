"use client";


import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/app/cart-context";
import { createSupabaseClient } from "@/lib/supabase-client";


export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  useEffect(() => {
  async function loadUserEmail() {
    const supabase = createSupabaseClient();

    const { data } = await supabase.auth.getUser();

    if (data.user?.email) {
      setUserEmail(data.user.email);
    }
  }

  loadUserEmail();
}, []);


  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * item.quantity,
    0
  );


  const paystackFee =
    cart.length > 0
      ? Math.min(Math.round(subtotal * 0.015 + 100), 2000)
      : 0;


  const total = subtotal + paystackFee;
  const sellerPayout = Math.round(subtotal * 0.85);
  const padimarketCommission = subtotal - sellerPayout;


  async function handleCheckout() {
    setCheckoutError(null);


    if (!userEmail) {
  setCheckoutError("Please sign in before making payment.");
  return;
}


    if (cart.length === 0) {
      setCheckoutError("Your cart is empty.");
      return;
    }


    setIsCheckingOut(true);


    try {
      const reference = `PADIMARKET-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;


      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
       body: JSON.stringify({
  email: userEmail,
  amount: Math.round(total * 100),
  reference,
}),
      });


      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.error || "Unable to start payment.");
      }


      window.location.href = data.authorization_url;
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
      setIsCheckingOut(false);
    }
  }


  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link href="/" style={styles.backLink}>
          ← Continue shopping
        </Link>


        <header style={{ marginBottom: "28px" }}>
          <h1 style={styles.title}>Your Cart</h1>
          <p style={styles.subtitle}>
            {cart.length === 0
              ? "No items yet"
              : `${cart.length} item${cart.length > 1 ? "s" : ""} in your cart`}
          </p>
        </header>


        {cart.length === 0 ? (
          <section style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: "46px", height: "46px" }}
                aria-hidden="true"
              >
                <path d="M5 9h14l-1.2 9.2A2 2 0 0 1 15.8 20H8.2a2 2 0 0 1-2-1.8L5 9Z" />
                <path d="M8 9V7a4 4 0 0 1 8 0v2" />
                <path d="M9.5 13v3M14.5 13v3" />
              </svg>
            </div>


            <h2 style={styles.emptyTitle}>
              Your cart is currently empty
            </h2>
            <p style={styles.emptyText}>
              Discover useful items and add them to your cart.
            </p>


            <Link href="/" style={styles.primaryButton}>
              Browse products
            </Link>
          </section>
        ) : (
          <div className="cart-grid">
            <section style={styles.itemsSection}>
              {cart.map((item) => (
                <article key={item.id} className="cart-item-card">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage(item.image_url || "/placeholder.png")
                    }
                    style={styles.imageButton}
                    aria-label="View product image"
                  >
                    <Image
                      src={item.image_url || "/placeholder.png"}
                      alt={item.title || "Product"}
                      width={140}
                      height={140}
                      style={styles.productImage}
                    />
                  </button>


                  <div>
                    <Link
                      href={`/products/${item.id}`}
                      style={styles.productTitle}
                    >
                      {item.title || "Product"}
                    </Link>


                    <p style={styles.productPrice}>
                      ₦{Number(item.price || 0).toLocaleString()}
                    </p>


                    <div style={styles.quantityRow}>
                      {item.stock > 1 ? (
                        <div style={styles.quantityControl}>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            style={quantityButtonStyle}
                          >
                            −
                          </button>


                          <span style={styles.quantityValue}>
                            {item.quantity}
                          </span>


                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.stock}
                            style={{
                              ...quantityButtonStyle,
                              opacity:
                                item.quantity >= item.stock ? 0.4 : 1,
                              cursor:
                                item.quantity >= item.stock
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span style={styles.quantitySingle}>
                          Quantity: 1
                        </span>
                      )}


                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        style={styles.removeButton}
                      >
                        Remove
                      </button>
                    </div>


                    <p style={styles.stockText}>
                      {item.quantity >= item.stock
                        ? `Maximum available: ${item.stock}`
                        : `${item.stock - item.quantity} available`}
                    </p>
                  </div>


                  <div style={styles.itemTotalSection}>
                    <span style={styles.itemTotalLabel}>Item total</span>
                    <strong style={styles.itemTotalValue}>
                      ₦
                      {(
                        Number(item.price || 0) * item.quantity
                      ).toLocaleString()}
                    </strong>
                  </div>
                </article>
              ))}
            </section>


            <aside style={styles.summaryCard}>
              <h2 style={styles.summaryTitle}>Order summary</h2>


              <div style={summaryRowStyle}>
                <span>Items subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>


              <div style={summaryRowStyle}>
                <span>Paystack processing fee</span>
                <span>₦{paystackFee.toLocaleString()}</span>
              </div>


              <div style={styles.totalRow}>
                <span>Total payment</span>
                <strong style={styles.totalValue}>
                  ₦{total.toLocaleString()}
                </strong>
              </div>


                           <div style={styles.deliveryNotice}>
                <strong>Delivery notice</strong>
                <p style={styles.deliveryText}>
                  PadiMarket does not handle or collect delivery fees. After
                  checkout, the buyer and seller will agree directly on pickup
                  or delivery and how any delivery cost will be paid.
                </p>
              </div>


              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckingOut || cart.length === 0}
                style={{
                  ...styles.checkoutButton,
                  background:
                    isCheckingOut || cart.length === 0
                      ? "#9ca3af"
                      : "linear-gradient(145deg, #17d39a, #0b9e77)",
                  cursor:
                    isCheckingOut || cart.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isCheckingOut ? "Starting payment..." : "Pay with Paystack"}
              </button>


              {checkoutError && (
                <p style={styles.errorText}>{checkoutError}</p>
              )}


              <p style={styles.paymentNote}>
                You will be redirected to Paystack to complete payment.
              </p>
            </aside>
          </div>
        )}
      </div>


      {selectedImage && (
        <div
          style={styles.imageOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
            style={styles.closeImageButton}
          >
            ✕
          </button>


          <Image
            src={selectedImage}
            alt="Product image"
            width={1200}
            height={1200}
            style={styles.zoomedImage}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}


const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    padding: "48px 20px 80px",
    fontFamily: "inherit",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  backLink: {
    display: "inline-block",
    marginBottom: "28px",
    color: "#0b9e77",
    fontWeight: 700,
    textDecoration: "none",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "34px",
    fontWeight: 800,
  },
  subtitle: {
    margin: 0,
    color: "var(--pm-muted)",
  },
  emptyCard: {
    display: "grid",
    justifyItems: "center",
    gap: "10px",
    padding: "70px 24px",
    background: "var(--pm-surface)",
    borderRadius: "28px",
    boxShadow: "var(--pm-shadow)",
    textAlign: "center",
  },
  emptyIcon: {
    display: "grid",
    placeItems: "center",
    width: "96px",
    height: "96px",
    marginBottom: "10px",
    borderRadius: "999px",
    background: "rgba(23, 211, 154, 0.12)",
    color: "#0b9e77",
  },
  emptyTitle: {
    margin: 0,
    fontSize: "24px",
  },
  emptyText: {
    margin: "0 0 16px",
    color: "var(--pm-muted)",
  },
  primaryButton: {
    padding: "12px 22px",
    borderRadius: "999px",
    background: "linear-gradient(145deg, #17d39a, #0b9e77)",
    color: "white",
    fontWeight: 800,
    textDecoration: "none",
  },
  grid: {},
  itemsSection: {
    display: "grid",
    gap: "16px",
  },
itemCard: {},
  imageButton: {
    border: 0,
    padding: 0,
    background: "none",
    cursor: "zoom-in",
  },
  productImage: {
    width: "140px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "18px",
    background: "var(--pm-bg)",
  },
  productTitle: {
    display: "inline-block",
    marginBottom: "6px",
    color: "var(--pm-text)",
    fontSize: "19px",
    fontWeight: 800,
    textDecoration: "none",
  },
  productPrice: {
    margin: "0 0 16px",
    color: "var(--pm-muted)",
  },
  quantityRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  quantityControl: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    padding: "7px 10px",
    border: "1px solid var(--pm-border)",
    borderRadius: "999px",
    background: "var(--pm-bg)",
  },
  quantityValue: {
    minWidth: "22px",
    textAlign: "center",
    fontWeight: 700,
  },
  quantitySingle: {
    padding: "7px 14px",
    border: "1px solid var(--pm-border)",
    borderRadius: "999px",
    background: "var(--pm-bg)",
    fontWeight: 700,
  },
  removeButton: {
    border: 0,
    background: "none",
    color: "#dc2626",
    fontWeight: 700,
    cursor: "pointer",
  },
  stockText: {
    margin: "12px 0 0",
    color: "var(--pm-muted)",
    fontSize: "13px",
  },
 itemTotalSection: {
  display: "grid",
  alignContent: "center",
  justifyItems: "end",
  gap: "5px",
},
  itemTotalLabel: {
    color: "var(--pm-muted)",
    fontSize: "13px",
  },
  itemTotalValue: {
    fontSize: "19px",
    color: "#0b9e77",
  },
  summaryCard: {
    padding: "26px",
    background: "var(--pm-surface)",
    borderRadius: "24px",
    boxShadow: "var(--pm-shadow)",
  },
  summaryTitle: {
    margin: "0 0 20px",
    fontSize: "21px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    paddingTop: "16px",
    borderTop: "1px solid var(--pm-border)",
    fontSize: "19px",
    fontWeight: 800,
  },
  totalValue: {
    color: "#0b9e77",
  },
  emailLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid var(--pm-border)",
    background: "var(--pm-bg)",
    color: "var(--pm-text)",
    fontSize: "15px",
    outline: "none",
  },
  deliveryNotice: {
    marginTop: "18px",
    padding: "16px",
    borderRadius: "16px",
    background: "rgba(23, 211, 154, 0.12)",
    color: "#0b9e77",
    fontSize: "13px",
    lineHeight: 1.6,
  },
  deliveryText: {
    margin: "6px 0 0",
  },
  checkoutButton: {
    width: "100%",
    marginTop: "18px",
    padding: "15px 20px",
    border: 0,
    borderRadius: "999px",
    color: "white",
    fontSize: "16px",
    fontWeight: 800,
  },
  errorText: {
    marginTop: "12px",
    color: "#ef4444",
    fontSize: "14px",
    fontWeight: 600,
  },
  paymentNote: {
    margin: "14px 0 0",
    color: "var(--pm-muted)",
    fontSize: "13px",
    textAlign: "center",
  },
  imageOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "grid",
    placeItems: "center",
    background: "rgba(0, 0, 0, 0.92)",
    padding: "24px",
  },
  closeImageButton: {
    position: "absolute",
    top: "24px",
    right: "24px",
    width: "46px",
    height: "46px",
    borderRadius: "999px",
    border: 0,
    background: "rgba(255, 255, 255, 0.15)",
    color: "white",
    fontSize: "24px",
    fontWeight: 800,
    cursor: "pointer",
  },
  zoomedImage: {
    maxWidth: "100%",
    maxHeight: "90vh",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    borderRadius: "18px",
  },
};


const quantityButtonStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  border: 0,
  borderRadius: "999px",
  background: "var(--pm-surface)",
  color: "#0b9e77",
  fontSize: "18px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.08)",
};


const summaryRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "14px",
  color: "var(--pm-muted)",
};