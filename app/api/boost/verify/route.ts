import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference");

    if (!reference) {
      return NextResponse.redirect(
        new URL("/seller/boost?error=missing_reference", request.url)
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecretKey) {
      return NextResponse.redirect(
        new URL("/seller/boost?error=paystack_not_configured", request.url)
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status || data.data.status !== "success") {
      return NextResponse.redirect(
        new URL("/seller/boost?error=payment_not_successful", request.url)
      );
    }

    const metadata = data.data.metadata;
const userId = metadata?.seller_id;
const credits = Number(metadata?.credits || 0);

    if (!userId || credits <= 0) {
      return NextResponse.redirect(
        new URL("/seller/boost?error=invalid_payment_metadata", request.url)
      );
    }

    const { data: seller, error: sellerError } = await supabase
  .from("sellers")
  .select("boost_credits")
  .eq("user_id", userId)
  .single();

   if (sellerError || !seller) {
  return NextResponse.redirect(
    new URL("/seller/boost?error=seller_profile_not_found", request.url)
  );
}

    const currentCredits = Number(seller.boost_credits || 0);
const newCredits = currentCredits + credits;

const { error: updateError } = await supabase
  .from("sellers")
  .update({ boost_credits: newCredits })
  .eq("user_id", userId);

    if (updateError) {
      return NextResponse.redirect(
        new URL("/seller/boost?error=could_not_update_credits", request.url)
      );
    }

    return NextResponse.redirect(
      new URL("/seller/boost?success=true", request.url)
    );
  } catch (error) {
    console.error("Boost verification error:", error);

    return NextResponse.redirect(
      new URL("/seller/boost?error=verification_failed", request.url)
    );
  }
}