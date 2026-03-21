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

  // Check if referred user has >= $300 MXN in completed purchases
  const { data: purchases } = await supabase
    .from("purchases")
    .select("amount_mxn")
    .eq("buyer_wallet", referred_wallet)
    .eq("status", "completed");

  const totalMxn = (purchases || []).reduce((sum: number, p: any) => sum + (parseFloat(p.amount_mxn) || 0), 0);

  if (totalMxn < 300) {
    return NextResponse.json({ error: `Invitado necesita $300 MXN en compras. Actual: $${totalMxn.toFixed(2)} MXN` }, { status: 400 });
  }

  return NextResponse.json({ success: true, totalMxn, referral });
}
