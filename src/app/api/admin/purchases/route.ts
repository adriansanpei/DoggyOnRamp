import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("[admin/purchases] Variables de entorno faltantes");
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error, count } = await supabase
    .from("doggy_orders")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[admin/purchases] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[admin/purchases] count:", count, "data.length:", data?.length, "error:", error);

  return NextResponse.json(
    { purchases: data ?? [], total: count },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    }
  );
}
