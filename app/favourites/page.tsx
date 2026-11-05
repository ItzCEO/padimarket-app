"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSupabaseClient } from "@/lib/supabase-client";

type Product = {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  location: string | null;
};

function makeSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FavouritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadFavourites() {
      const supabase = createSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNotice("Please sign in to see your saved products.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("favourites")
        .select(
          `
          product_id,
          products (
            id,
            title,
            price,
            image_url,
            location
          )
        `
        )
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        setNotice("Could not load your favourites.");
        setLoading(false);
        return;
      }

      const savedProducts =
        data
          ?.map((item: any) => item.products)
          .filter(Boolean) || [];

      setProducts(savedProducts);
      setLoading(false);
    }

    loadFavourites();
  }, []);

  async function removeFavourite(productId: string) {
    const supabase = createSupabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (!error) {
      setProducts((current) =>
        current.filter((product) => product.id !== productId)
      );
      setNotice("Removed from favourites.");
    }
  }

  if (loading) {
    return (
      <main className="favourites-page">
        <div className="shell">
          <div className="page-top-actions">
  <Link href="/" className="pill primary">
    ← Back home
  </Link>
</div>
          <h1>Favourites</h1>
          <p>Loading your saved products...</p>
        </div>
      </main>
    );
  }

  return (
  <main className="favourites-page">
    <div className="shell">
      <div className="page-top-actions">
        <Link href="/" className="pill primary">
          ← Back home
        </Link>
      </div>

      <h1>Favourites</h1>

        {notice && <p className="notice">{notice}</p>}

        {products.length === 0 ? (
          <div className="empty-state">
            <p>You have not saved any products yet.</p>
            <Link className="pill primary" href="/">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="favourites-grid">
            {products.map((product) => (
              <div key={product.id} className="favourite-card">
                <Link href={`/product/${makeSlug(product.title)}`}>
                  <div className="favourite-image">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        width={400}
                        height={400}
                        style={{
                          width: "100%",
                          height: "220px",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div className="no-image">No image</div>
                    )}
                  </div>

                  <div className="favourite-info">
                    <h3>{product.title}</h3>
                    <strong>
                      ₦{Number(product.price).toLocaleString("en-NG")}
                    </strong>
                    <span>📍 {product.location || "Lagos"}</span>
                  </div>
                </Link>

                <button
                  className="remove-favourite"
                  onClick={() => removeFavourite(product.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}