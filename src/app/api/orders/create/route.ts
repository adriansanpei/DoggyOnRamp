import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface CreateOrderBody {
  mxnAmount: number;
  doggyAmount: number;
  usdcAmount: string;
  usdcMxnRate: number;
  userWallet: string;
  particleUserId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { mxnAmount, doggyAmount, usdcAmount, usdcMxnRate, userWallet, particleUserId } = body;

    if (!mxnAmount || !doggyAmount || !userWallet) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (mxnAmount < 10) {
      return NextResponse.json({ error: "Monto mínimo $10 MXN" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find existing pending orders with same base amount to avoid duplicate exact amounts
    const baseAmount = Math.floor(mxnAmount * 1000) / 1000;
    const { data: pendingOrders } = await supabase
      .from("doggy_orders")
      .select("exact_amount")
      .eq("status", "pending")
      .gte("exact_amount", baseAmount)
      .lt("exact_amount", baseAmount + 1);

    // Generate unique exact amount (2 decimals for SPEI compatibility)
    let exactAmount = baseAmount + 0.01;
    const usedAmounts = new Set((pendingOrders || []).map((o: any) => Math.round(o.exact_amount * 100)));
    while (usedAmounts.has(Math.round(exactAmount * 100)) && exactAmount < baseAmount + 0.99) {
      exactAmount += 0.01;
    }

    // Round to 2 decimals
    exactAmount = Math.round(exactAmount * 100) / 100;

    const { data: order, error: dbError } = await supabase
      .from("doggy_orders")
      .insert({
        particle_user_id: particleUserId || null,
        user_wallet: userWallet,
        mxn_amount: mxnAmount,
        doggy_amount: doggyAmount,
        usdc_amount: usdcAmount ? parseFloat(usdcAmount) : null,
        usdc_mxn_rate: usdcMxnRate || null,
        exact_amount: exactAmount,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json(order);
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
