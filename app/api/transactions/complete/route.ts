import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Transaction complete API is running.",
  });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const transactionId = body?.transactionId;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required." },
        { status: 400 }
      );
    }

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (transactionError || !transaction) {
      return NextResponse.json(
        { error: "Transaction not found." },
        { status: 404 }
      );
    }

    if (transaction.buyer_id !== user.id) {
      return NextResponse.json(
        { error: "Only the buyer can complete this transaction." },
        { status: 403 }
      );
    }

    if (transaction.status !== "paid") {
      return NextResponse.json(
        {
          error: `This transaction cannot be completed because its status is "${transaction.status}".`,
        },
        { status: 400 }
      );
    }

    const { data: existingPayout } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("type", "credit")
      .maybeSingle();

    if (existingPayout) {
      return NextResponse.json(
        { error: "This transaction has already been completed." },
        { status: 400 }
      );
    }

    const sellerCredit = Math.floor(transaction.amount * 0.85);
    const platformFee = transaction.amount - sellerCredit;

    const { error: updateError } = await supabaseAdmin
      .from("transactions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (updateError) {
      return NextResponse.json(
        { error: "Could not complete the transaction." },
        { status: 500 }
      );
    }

    const { error: walletError } = await supabaseAdmin
      .from("wallet_transactions")
      .insert({
        seller_id: transaction.seller_id,
        transaction_id: transaction.id,
        reference: `HANDSHAKE-${transaction.id}`,
        amount: sellerCredit,
        type: "credit",
        status: "completed",
      });

    if (walletError) {
      return NextResponse.json(
        { error: "Transaction completed, but seller wallet credit failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Handshake completed. Seller wallet credited.",
      sellerCredit,
      platformFee,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}