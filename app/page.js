"use client";

import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const { user, loading, supabase } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Loading PadiMarket...</p>
      </main>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-green-700">
          PadiMarket
        </h1>

        <button
          onClick={handleLogout}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </header>

      <section className="p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome to PadiMarket
        </h2>
        <p className="text-gray-600">
          Browse products, add items to your cart, and shop easily.
        </p>
      </section>
    </main>
  );
}