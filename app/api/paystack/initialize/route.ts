import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, amount, reference } = body;

    if (!email || !amount || !reference) {
      return NextResponse.json(
        { error: "Email, amount, and reference are required." },
        { status: 400 }
      );
    }

    const itemAmountKobo = Number(amount);

    if (!Number.isFinite(itemAmountKobo) || itemAmountKobo <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    // Paystack Nigeria fee: 1.5% + ₦100, capped at ₦2,000.
    // In kobo: ₦100 = 10000, ₦2,000 = 200000.
    const calculatePaystackFeeKobo = (valueKobo: number) => {
      return Math.min(
        Math.round(valueKobo * 0.015) + 10000,
        200000
      );
    };

    // First estimate using the item price.
    let paystackFeeKobo = calculatePaystackFeeKobo(itemAmountKobo);

    // Buyer pays item price + Paystack fee.
    let totalAmountKobo = itemAmountKobo + paystackFeeKobo;

    // Refine once because Paystack charges its fee on the full amount paid.
    paystackFeeKobo = calculatePaystackFeeKobo(totalAmountKobo);
    totalAmountKobo = itemAmountKobo + paystackFeeKobo;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: totalAmountKobo,
          reference,
          currency: "NGN",
          callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        }),
      }
    );

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { error: data.message || "Unable to initialize payment." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      itemAmountKobo,
      paystackFeeKobo,
      totalAmountKobo,
    });
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { error: "Something went wrong while starting payment." },
      { status: 500 }
    );
  }
}