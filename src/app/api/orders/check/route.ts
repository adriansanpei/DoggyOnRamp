import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: order } = await supabase.from("doggy_orders").select("id, status, solana_tx_signature").eq("id", id).single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ status: order.status, solana_tx_signature: order.solana_tx_signature });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
