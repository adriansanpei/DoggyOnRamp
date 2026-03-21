import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { referral_id, referred_wallet } = await req.json();
  if (!referral_id || !referred_wallet) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Check referral exists and is qualified
  const { data: referral, error } = await supabase
    .from("referrals")
    .select("*")
    .eq("id", referral_id)
    .single();

  if (error || !referral) return NextResponse.json({ error: "referral not found" }, { status: 400 });
  if (referral.status !== "qualified") return NextResponse.json({ error: "referral not qualified" }, { status: 400 });

  // Get min MXN from config
  const { data: cfg } = await supabase.from("bot_config").select("value").eq("key", "referral_min_mxn").single();
  const minMxn = cfg ? parseFloat(cfg.value) : 300;

  // Check completed orders from doggy_orders
  const { data: orders } = await supabase
    .from("doggy_orders")
    .select("mxn_amount")
    .eq("user_wallet", referred_wallet)
    .eq("status", "completed");

  const totalMxn = (orders || []).reduce((sum: number, o: any) => sum + (parseFloat(o.mxn_amount) || 0), 0);

  if (totalMxn < minMxn) {
    return NextResponse.json({ error: `Invitado necesita $${minMxn} MXN en compras. Actual: $${totalMxn.toFixed(2)} MXN` }, { status: 400 });
  }

  return NextResponse.json({ success: true, totalMxn, referral });
}
