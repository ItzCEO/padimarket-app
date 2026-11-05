"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function BoostCheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("reference");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    if (!reference) {
      setMessage("Payment reference not found.");
      return;
    }

    async function verifyPayment() {
      try {
        const response = await fetch(
          `/api/boost/verify?reference=${encodeURIComponent(reference)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "We could not confirm your payment.");
          return;
        }

        setMessage("Payment successful! Your Boost credit has been added.");

        setTimeout(() => {
          router.push("/seller/boost");
        }, 2000);
      } catch (error) {
        console.error(error);
        setMessage("Something went wrong while confirming your payment.");
      }
    }

    verifyPayment();
  }, [reference, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
        <h1 className="text-2xl font-bold mb-4">Boost Payment</h1>
        <p className="text-gray-700">{message}</p>

        <button
          onClick={() => router.push("/seller/boost")}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
        >
          Back to Boost
        </button>
      </div>
    </div>
  );
}