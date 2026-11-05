import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const { data: seller, error: sellerError } = await supabaseAdmin
      .from("sellers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json(
        { error: "Seller profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      seller,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Seller dashboard error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}