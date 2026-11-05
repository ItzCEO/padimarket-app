import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Please complete the reCAPTCHA." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY ?? "",
          response: token,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to verify reCAPTCHA." },
      { status: 500 }
    );
  }
}