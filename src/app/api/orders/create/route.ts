import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const JUP_BASE = "https://public.jupiterapi.com";
const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";

interface CreateOrderBody {
  mxnAmount: number;
  userWallet: string;
  particleUserId?: string;
}

async function getUsdcMxnRate(): Promise<number> {
  // Source 1: Binance US
  try {
    const res = await fetch("https://api.binance.us/api/v3/ticker/price?symbol=USDCMXN");
    if (res.ok) { const data = await res.json(); return parseFloat(data.price); }
  } catch {}

  // Source 2: CryptoCompare
  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=MXN");
    if (res.ok) { const data = await res.json(); return data.MXN; }
  } catch {}

  throw new Error("No se pudo obtener el precio USDC/MXN");
}

async function getDoggyQuote(usdcAmount: number): Promise<number> {
  // usdcAmount in USDC (e.g. 0.58)
  // Jupiter expects amount in smallest unit: USDC has 6 decimals
  const amountLamports = Math.floor(usdcAmount * 1_000_000);
  const params = new URLSearchParams({
    inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    outputMint: DOGGY_MINT,
    amount: String(amountLamports),
    slippageBps: "100",
  });

  const res = await fetch(`${JUP_BASE}/quote?${params}`);
  if (!res.ok) throw new Error("Error consultando Jupiter");
  const data = await res.json();
  if (!data.outAmount) throw new Error("Jupiter no devolvió outAmount");

  // outAmount is in smallest unit (6 decimals for DOGGY)
  return Number(data.outAmount) / 1_000_000;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { mxnAmount, userWallet, particleUserId } = body;

    if (!mxnAmount || !userWallet) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (mxnAmount < 10) {
      return NextResponse.json({ error: "Monto mínimo $10 MXN" }, { status: 400 });
    }

    // === SERVER-SIDE PRICE CALCULATION ===
    const usdcMxnRate = await getUsdcMxnRate();
    const usdcAmount = mxnAmount / usdcMxnRate;
    const doggyAmount = await getDoggyQuote(usdcAmount);

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
    exactAmount = Math.round(exactAmount * 100) / 100;

    const { data: order, error: dbError } = await supabase
      .from("doggy_orders")
      .insert({
        particle_user_id: particleUserId || null,
        user_wallet: userWallet,
        mxn_amount: mxnAmount,
        doggy_amount: doggyAmount,
        usdc_amount: usdcAmount,
        usdc_mxn_rate: usdcMxnRate,
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
