"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Product = {
  id: string;
  title: string;
  price: number;
  location: string | null;
  image_url: string | null;
  boosted_until: string | null;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      setLoading(true);

      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
  .from("products")
  .select("id, title, price, location, image_url, boosted_until")
  .ilike("title", `%${query}%`)
  .order("boosted_until", {
    ascending: false,
    nullsFirst: false,
  })
  .order("created_at", { ascending: false });

      if (error) {
  console.error("Search error:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
  setProducts([]);
} else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadResults();
  }, [query]);

console.log("Search page loaded. Query:", query, "Products:", products.length);
  return (
    <main style={{ minHeight: "100vh", padding: "100px 20px 60px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          Search results for “{query}”
        </h1>

        {loading ? (
          <p style={{ marginTop: 20 }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No products found. Try another search term.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
              marginTop: 30,
            }}
          >
{products.map((product) => (
  <div
    key={product.id}
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 16,
      overflow: "hidden",
      background: "#fff",
    }}
  >

    {product.image_url && (
      <img
        src={product.image_url}
        alt={product.title}
        style={{
          width: "100%",
          height: 180,
          objectFit: "cover",
        }}
      />
    )}

    <div style={{ padding: 16 }}>
     <Link
  href={`/product/${product.id}`}
  style={{
    color: "inherit",
    textDecoration: "none",
  }}
>
  <h3
    style={{
      margin: 0,
      fontSize: 16,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {product.boosted_until &&
      new Date(product.boosted_until) > new Date() && (
        <span
          style={{
            fontSize: 14,
            color: "#f59e0b",
          }}
          title="Boosted listing"
        >
          ⚡
        </span>
      )}

    <span>{product.title}</span>
  </h3>
</Link>
      <p style={{ margin: "8px 0 0", fontWeight: 800 }}>
        ₦{Number(product.price).toLocaleString("en-NG")}
      </p>

      {product.location && (
        <p style={{ margin: "6px 0 0", color: "#64748b" }}>
          {product.location}
        </p>
      )}
    </div>
  </div>
))}
          </div>
        )}
      </div>
    </main>
  );
}