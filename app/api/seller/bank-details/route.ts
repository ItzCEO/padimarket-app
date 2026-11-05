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

    const { data: bankAccount } = await supabaseAdmin
      .from("seller_bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      bankAccount: bankAccount || null,
      walletBalance: Number(seller?.wallet_balance || 0),
    });
  } catch (error) {
    console.error("Get bank details error:", error);
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const { bankName, bankCode, accountNumber, accountName } =
      await request.json();

    if (!bankName || !bankCode || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: "All bank details are required." },
        { status: 400 }
      );
    }

    const recipientResponse = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "nuban",
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: "NGN",
        }),
      }
    );

    const recipientResult = await recipientResponse.json();

    if (!recipientResult.status) {
      return NextResponse.json(
        {
          error:
            recipientResult.message ||
            "We could not create your payout recipient.",
        },
        { status: 400 }
      );
    }

    const recipientCode = recipientResult.data.recipient_code;

    const { error } = await supabaseAdmin
      .from("seller_bank_accounts")
      .upsert(
        {
          user_id: user.id,
          bank_name: bankName,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName,
          recipient_code: recipientCode,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error("Bank details database error:", error);
      return NextResponse.json(
        { error: "We could not save your bank details." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Bank details saved successfully.",
    });
  } catch (error) {
    console.error("Save bank details error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}