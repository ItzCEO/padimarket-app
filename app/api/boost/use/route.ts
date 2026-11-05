import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    const body = await request.json();
    const listingId = body?.listingId;

    if (!listingId) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 400 }
      );
    }

    // Get seller and Boost credits
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("id, boost_credits")
      .eq("user_id", userId)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 }
      );
    }

    const currentCredits = Number(seller.boost_credits || 0);

    if (currentCredits < 1) {
      return NextResponse.json(
        { error: "You do not have enough Boost credits." },
        { status: 400 }
      );
    }

    // Check the listing belongs to this seller
    const { data: listing, error: listingError } = await supabase
      .from("products")
      .select("id, seller_id, boosted_until")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { error: "Listing not found." },
        { status: 404 }
      );
    }

    if (listing.seller_id !== userId) {
      return NextResponse.json(
        { error: "You can only boost your own listing." },
        { status: 403 }
      );
    }

    // Set Boost end date: 3 days from now
    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + 3);

    // Update the listing
    const { error: updateListingError } = await supabase
      .from("products")
      .update({ boosted_until: boostedUntil.toISOString() })
      .eq("id", listingId);

    if (updateListingError) {
      console.error("Error boosting listing:", updateListingError);

      return NextResponse.json(
        { error: "We could not boost this listing." },
        { status: 500 }
      );
    }

    // Reduce Boost credits by 1
    const newCredits = currentCredits - 1;

    const { error: updateCreditsError } = await supabase
      .from("sellers")
      .update({ boost_credits: newCredits })
      .eq("id", seller.id);

    if (updateCreditsError) {
      console.error("Error updating Boost credits:", updateCreditsError);

      return NextResponse.json(
        { error: "We could not update your Boost credits." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boostCredits: newCredits,
      boostedUntil: boostedUntil.toISOString(),
    });
  } catch (error) {
    console.error("Boost use error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}