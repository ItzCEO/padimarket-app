import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, title, price")
      .ilike("title", `%${query}%`)
      .limit(8);

    if (error) {
      console.error("Suggestion error:", error);
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({ suggestions: data || [] });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}