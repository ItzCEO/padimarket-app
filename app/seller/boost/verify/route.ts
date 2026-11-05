import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);


const PRICE_PER_CREDIT = 500;


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");


    if (!reference) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=failed`
      );
    }


    const { data: payment } = await supabaseAdmin
      .from("boost_payments")
      .select("*")
      .eq("paystack_reference", reference)
      .single();


    if (!payment) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=failed`
      );
    }


    if (payment.status === "successful") {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=success`
      );
    }


    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );


    const paystackData = await paystackResponse.json();


    const paystackStatus = paystackData?.data?.status;
    const paidAmountKobo = Number(paystackData?.data?.amount || 0);
    const expectedAmountKobo = payment.amount * 100;


    if (
      !paystackResponse.ok ||
      paystackStatus !== "success" ||
      paidAmountKobo !== expectedAmountKobo
    ) {
      await supabaseAdmin
        .from("boost_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);


      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=failed`
      );
    }


    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("boost_credits")
      .eq("user_id", payment.seller_id)
      .single();


    const currentCredits = seller?.boost_credits || 0;


    await supabaseAdmin
      .from("sellers")
      .update({
        boost_credits: currentCredits + payment.credits,
      })
      .eq("user_id", payment.seller_id);


    await supabaseAdmin
      .from("boost_payments")
      .update({ status: "successful" })
      .eq("id", payment.id);


    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=success`
    );
  } catch (error) {
    console.error("Boost verify error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/seller/boost?status=failed`
    );
  }
}