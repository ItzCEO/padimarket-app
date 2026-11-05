import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);


const PRICE_PER_CREDIT = 500;


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


    const body = await request.json();
    const credits = Number(body.credits);


    if (!credits || credits < 1) {
      return NextResponse.json(
        { error: "Choose at least 1 Boost credit." },
        { status: 400 }
      );
    }


    const amountInNaira = credits * PRICE_PER_CREDIT;
    const amountInKobo = amountInNaira * 100;


    const reference = `boost_${user.id.slice(0, 8)}_${Date.now()}`;


    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("boost_payments")
      .insert({
        seller_id: user.id,
        credits,
        amount: amountInNaira,
        paystack_reference: reference,
        status: "pending",
      })
      .select()
      .single();


    if (paymentError || !payment) {
      console.error("Boost payment record error:", paymentError);
      return NextResponse.json(
        { error: "We could not start your Boost payment." },
        { status: 500 }
      );
    }


    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountInKobo,
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/boost/verify`,
          metadata: {
            seller_id: user.id,
            credits,
          },
        }),
      }
    );


       const paystackData = await paystackResponse.json();


    console.log("PAYSTACK VERIFY RESPONSE:", JSON.stringify(paystackData, null, 2));


    const paystackStatus = paystackData?.data?.status;


    if (
      !paystackResponse.ok ||
      !paystackData?.data?.authorization_url
    ) {
      console.error("Paystack initialize error:", paystackData);


      await supabaseAdmin
        .from("boost_payments")
        .update({ status: "failed" })
        .eq("id", payment.id);


      return NextResponse.json(
        { error: "We could not connect to Paystack. Please try again." },
        { status: 500 }
      );
    }


    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
    });
  } catch (error) {
    console.error("Boost checkout error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}