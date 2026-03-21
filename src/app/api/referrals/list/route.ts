import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("referrals")
    .select("*")
    .or(`referrer_wallet.eq.${wallet},referred_wallet.eq.${wallet}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referrals: data || [] });
}

export async function POST(req: NextRequest) {
  const { referrer_code, referred_wallet } = await req.json();
  if (!referrer_code || !referred_wallet) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Don't self-refer
  const { data: selfRef } = await supabase
    .from("referral_codes")
    .select("wallet_address")
    .eq("code", referrer_code)
    .single();

  if (selfRef?.wallet_address === referred_wallet) {
    return NextResponse.json({ error: "no self-referral" }, { status: 400 });
  }

  // Check if already referred
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_wallet", referred_wallet)
    .single();

  if (existing) {
    return NextResponse.json({ message: "already referred" });
  }

  // Check if user already has completed purchases in doggy_orders
  const { data: pastOrders } = await supabase
    .from("doggy_orders")
    .select("id")
    .eq("user_wallet", referred_wallet)
    .eq("status", "completed")
    .limit(1);

  if (pastOrders && pastOrders.length > 0) {
    return NextResponse.json({ error: "existing user cannot be referred" }, { status: 400 });
  }

  // Get referrer wallet from code
  const { data: referrer, error } = await supabase
    .from("referral_codes")
    .select("wallet_address")
    .eq("code", referrer_code)
    .single();

  if (error || !referrer) {
    return NextResponse.json({ error: "invalid referral code" }, { status: 400 });
  }

  const { data: referral, error: insertError } = await supabase
    .from("referrals")
    .insert({
      referrer_wallet: referrer.wallet_address,
      referred_wallet,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  return NextResponse.json({ referral });
}
