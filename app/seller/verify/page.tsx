"use client";

import Link from "next/link";

export default function SellerVerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Seller Verification
        </h1>
        <p className="mt-2 text-gray-600">
          We could not find your seller profile yet. Please complete seller
          verification on the homepage.
        </p>

        <Link
          href="/?openSellerVerification=1"
          className="mt-6 inline-block bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Complete Seller Verification
        </Link>
      </div>
    </div>
  );
}