import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Verification service is not configured." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "You must be signed in to become a seller." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const idType = String(formData.get("idType") || "").trim();
    const idNumber = String(formData.get("idNumber") || "").trim();

    const profileImage = formData.get("profileImage") as File | null;
    const idImage = formData.get("idImage") as File | null;

    if (!fullName || !phone || !idType || !idNumber) {
      return NextResponse.json(
        { error: "Please complete all required fields." },
        { status: 400 }
      );
    }

    if (!profileImage || !idImage) {
      return NextResponse.json(
        { error: "Please upload your profile picture and valid ID." },
        { status: 400 }
      );
    }

    const profileBuffer = Buffer.from(await profileImage.arrayBuffer());
    const idBuffer = Buffer.from(await idImage.arrayBuffer());

    const profileFileName = `${user.id}/profile-${Date.now()}`;
    const idFileName = `${user.id}/id-${Date.now()}`;

    const { error: profileUploadError } = await supabaseAdmin.storage
      .from("seller-profile-images")
      .upload(profileFileName, profileBuffer, {
        contentType: profileImage.type || "image/jpeg",
        upsert: true,
      });

    if (profileUploadError) {
      console.error("Profile image upload error:", profileUploadError);
      return NextResponse.json(
        { error: "We could not upload your profile picture." },
        { status: 500 }
      );
    }

    const { error: idUploadError } = await supabaseAdmin.storage
      .from("seller-id-images")
      .upload(idFileName, idBuffer, {
        contentType: idImage.type || "image/jpeg",
        upsert: true,
      });

    if (idUploadError) {
      console.error("ID image upload error:", idUploadError);
      return NextResponse.json(
        { error: "We could not upload your ID image." },
        { status: 500 }
      );
    }

    const { data: profileUrlData } = supabaseAdmin.storage
      .from("seller-profile-images")
      .getPublicUrl(profileFileName);

    const { data: idUrlData } = supabaseAdmin.storage
      .from("seller-id-images")
      .getPublicUrl(idFileName);

    const profileImageUrl = profileUrlData.publicUrl;
    const idImageUrl = idUrlData.publicUrl;

    const idBase64 = idBuffer.toString("base64");

    const prompt = `
You are a strict seller verification assistant for PadiMarket, a Nigerian peer-to-peer marketplace.

Compare the full name printed on the uploaded identity document with the full name entered by the seller.

Seller details:
- Full name entered by seller: ${fullName}
- Phone number: ${phone}
- Selected ID type: ${idType}
- Entered ID number: ${idNumber}

Name matching rules:
- Ignore capital letters, extra spaces, commas, and name order where appropriate.
- The first name and surname on the ID should reasonably match the name entered by the seller.
- If the name on the ID is clearly different from the name entered, use "rejected".
- If the name is partially readable or you cannot confidently compare it, use "needs_review".
- Do not approve if the name on the ID cannot be read.

Also check:
1. Is the ID image readable?
2. Does the document look like the selected ID type?
3. Does the ID number format look reasonable?
4. Are there signs that the image is blurry, cropped, edited, or suspicious?

Do not store or reveal sensitive document details.

Respond ONLY with valid JSON in this exact format:
{
  "status": "approved" | "needs_review" | "rejected",
  "reason": "A short user-friendly explanation",
  "confidence": 0 to 100
}

Use "approved" only if the document is readable and the name on the ID clearly matches the name entered by the seller.
Use "needs_review" if the document is unclear or some details cannot be confirmed.
Use "rejected" if the name does not match or the submission is clearly invalid or suspicious.
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
          "Api-Revision": "2026-05-20",
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image",
              data: idBase64,
              mime_type: idImage.type || "image/jpeg",
            },
          ],
          response_format: {
            type: "text",
            mime_type: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const geminiError = await geminiResponse.json();
      console.error("Gemini verification error:", geminiError);

      return NextResponse.json(
        {
          error:
            geminiError?.error?.message ||
            "We could not verify your details right now.",
        },
        { status: 502 }
      );
    }

    const result = await geminiResponse.json();

    const outputText =
      result?.steps?.find(
        (step: { type?: string }) => step?.type === "model_output"
      )?.content?.[0]?.text || "";

    let verification;

    try {
      verification = JSON.parse(outputText);
    } catch {
      verification = {
        status: "needs_review",
        reason: "Your seller verification is under review.",
        confidence: 50,
      };
    }

    const status = verification.status;

    const { error: sellerError } = await supabaseAdmin
      .from("sellers")
      .upsert(
        {
          user_id: user.id,
          full_name: fullName,
          phone: phone,
          id_type: idType,
          id_number: idNumber,
          profile_image_url: profileImageUrl,
          id_image_url: idImageUrl,
          verification_status: status,
          verification_reason: verification.reason || "",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (sellerError) {
      console.error("Seller database error:", sellerError);
      return NextResponse.json(
        { error: "We could not save your seller verification." },
        { status: 500 }
      );
    }

    const userMessage =
      status === "approved"
        ? "Verification successful. Your seller account has been approved."
        : status === "rejected"
        ? "We could not verify your details. Please check your information and try again."
        : "Your seller verification is under review.";

    return NextResponse.json({
      status,
      message: userMessage,
      reason: verification.reason,
      confidence: verification.confidence,
    });
  } catch (error) {
    console.error("Seller verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}