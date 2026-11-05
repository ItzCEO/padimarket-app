import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    const { data: transaction, error } = await supabase
      .from("transactions")
      .select(
        `*,
        product:products (
          id,
          title,
          seller_name,
          seller_phone,
          image_url
        )`
      )
      .eq("id", id)
      .single();

    if (error || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    if (
      transaction.buyer_id !== user.id &&
      transaction.seller_id !== user.id
    ) {
      return NextResponse.json(
        { error: "You do not have access to this transaction." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      transaction,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}