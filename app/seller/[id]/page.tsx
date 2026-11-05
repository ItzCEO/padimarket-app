"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase-client";

type Seller = {
  id: string;
  full_name: string;
  profile_image_url: string | null;
  verification_status: string | null;
  created_at: string;
};

type Product = {
  id: string;
  title: string;
  price: number | string;
  location: string | null;
  condition: string | null;
  image_url: string | null;
  boosted_until: string | null;
};

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params?.id as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSeller() {
      if (!sellerId) return;

      const supabase = createSupabaseClient();

      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select(
          `
          id,
          full_name,
          profile_image_url,
          verification_status,
          created_at
        `
        )
        .eq("id", sellerId)
        .single();

      if (sellerError || !sellerData) {
        setError("Seller not found.");
        setLoading(false);
        return;
      }

      setSeller(sellerData);

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          `
          id,
          title,
          price,
          location,
          condition,
          image_url,
          boosted_until
        `
        )
        .eq("seller_id", sellerId)
        .eq("status", "available")
        .order("boosted_until", {
          ascending: false,
          nullsFirst: false,
        })
        .order("created_at", { ascending: false });

      if (productError) {
        console.error("Error loading seller products:", productError);
      } else {
        setProducts(productData || []);
      }

      setLoading(false);
    }

    loadSeller();
  }, [sellerId]);

  if (loading) {
    return (
      <main className="pm">
        <div className="shell">
          <p>Loading seller profile...</p>
        </div>
      </main>
    );
  }

  if (error || !seller) {
    return (
      <main className="pm">
        <div className="shell">
          <h1>Seller not found</h1>
          <p>{error}</p>
          <Link href="/" className="pill primary">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const isVerified = seller.verification_status === "approved";

  return (
    <main className="pm">
      <div className="shell">
        <section className="section">
          <div className="seller-profile clay">
            <div className="seller-profile-head">
              {seller.profile_image_url ? (
                <img
                  src={seller.profile_image_url}
                  alt={seller.full_name}
                  className="seller-avatar"
                />
              ) : (
                <div className="seller-avatar seller-avatar-placeholder">
                  {seller.full_name?.charAt(0)?.toUpperCase() || "S"}
                </div>
              )}

              <div>
                <h1>{seller.full_name}</h1>

                <p>
                  {isVerified ? "✅ Verified seller" : "Seller"}
                  {" · "}
                  Member since{" "}
                  {new Date(seller.created_at).toLocaleDateString("en-NG", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <h2>Items from this seller</h2>

            {products.length === 0 ? (
              <p>No listings found from this seller yet.</p>
            ) : (
              <div className="products">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="product-link"
                  >
                    <article className="product clay">
                      <div className="product-media">
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
                            new Date(product.boosted_until) >
                              new Date() && (
                              <span
                                style={{
                                  color: "#f59e0b",
                                  marginRight: 4,
                                }}
                              >
                                ⚡
                              </span>
                            )}
                          {product.title}
                        </h3>

                        <div className="product-foot">
                          <strong>
                            ₦
                            {Number(product.price).toLocaleString("en-NG")}
                          </strong>
                          <span className="view-button">View →</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}