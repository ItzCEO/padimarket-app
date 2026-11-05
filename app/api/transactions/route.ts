import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in again." },
        { status: 401 }
      );
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `*,
        product:products (
          id,
          title,
          seller_name,
          image_url
        )`
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Could not load your transactions." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: transactions ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}