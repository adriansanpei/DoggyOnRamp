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
  solOption?: number; // 0 = none, 0.50 or 3 (USD)
}

async function getUsdcMxnRate(): Promise<number> {
  try {
    const res = await fetch("https://api.binance.us/api/v3/ticker/price?symbol=USDCMXN");
    if (res.ok) { const data = await res.json(); return parseFloat(data.price); }
  } catch {}
  try {
    const res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=MXN");
    if (res.ok) { const data = await res.json(); return data.MXN; }
  } catch {}
  throw new Error("No se pudo obtener el precio USDC/MXN");
}

async function getDoggyQuote(usdcAmount: number): Promise<number> {
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
  return Number(data.outAmount) / 1_000_000;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();
    const { mxnAmount, userWallet, particleUserId, solOption = 0 } = body;

    if (!mxnAmount || !userWallet) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (mxnAmount < 10) {
      return NextResponse.json({ error: "Monto mínimo $10 MXN" }, { status: 400 });
    }

    const usdcMxnRate = await getUsdcMxnRate();

    // Calculate SOL for gas if requested
    const solUsd = solOption; // 0, 0.50 or 3 USD
    const solMxn = solUsd * usdcMxnRate;
    const mxnForDoggy = mxnAmount - solMxn;

    if (mxnForDoggy < 10) {
      return NextResponse.json({ error: `Monto insuficiente para DOGGY después de SOL. Necesitas $10+ MXN restantes.` }, { status: 400 });
    }

    const usdcAmount = mxnForDoggy / usdcMxnRate;
    const doggyAmount = await getDoggyQuote(usdcAmount);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: dbError } = await supabase
      .from("doggy_orders")
      .insert({
        particle_user_id: particleUserId || null,
        user_wallet: userWallet,
        mxn_amount: mxnForDoggy,
        doggy_amount: doggyAmount,
        usdc_amount: usdcAmount,
        usdc_mxn_rate: usdcMxnRate,
        exact_amount: mxnForDoggy,
        sol_usd: solUsd,
        sol_mxn: solMxn,
        status: "pending",
      })
      .select()
      .single();

    if (dbError) throw new Error(dbError.message);

    // Add SOL info to response
    const response = {
      ...order,
      sol_usd: solUsd,
      sol_mxn: solMxn,
      total_mxn: mxnAmount,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
