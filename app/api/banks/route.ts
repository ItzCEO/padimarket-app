import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.paystack.co/bank?currency=NGN",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const result = await response.json();

    if (!result.status) {
      return NextResponse.json(
        { error: result.message || "Unable to load banks." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      banks: result.data,
    });
  } catch (error) {
    console.error("Bank list error:", error);
    return NextResponse.json(
      { error: "Unable to load banks." },
      { status: 500 }
    );
  }
}