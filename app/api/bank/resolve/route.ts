import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank are required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "We could not verify this account." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      accountName: result.data.account_name,
      accountNumber: result.data.account_number,
    });
  } catch (error) {
    console.error("Account resolution error:", error);
    return NextResponse.json(
      { error: "We could not verify this account." },
      { status: 500 }
    );
  }
}