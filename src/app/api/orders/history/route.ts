import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get("wallet");
    if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: orders } = await supabase
      .from("doggy_orders")
      .select("id, mxn_amount, doggy_amount, exact_amount, status, created_at, solana_tx_signature")
      .eq("user_wallet", wallet)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ orders: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
