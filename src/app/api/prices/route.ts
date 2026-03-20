import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Try multiple sources for USDC/MXN price
    let price = null;

    // Source 1: Binance US
    try {
      const res = await fetch("https://api.binance.us/api/v3/ticker/price?symbol=USDCMXN");
      if (res.ok) { const data = await res.json(); price = parseFloat(data.price); }
    } catch {}

    // Source 2: CryptoCompare
    if (!price) {
      try {
        const res = await fetch("https://min-api.cryptocompare.com/data/price?fsym=USDC&tsyms=MXN");
        if (res.ok) { const data = await res.json(); price = data.MXN; }
      } catch {}
    }

    // Source 3: CoinGecko
    if (!price) {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=mxn");
        if (res.ok) { const data = await res.json(); price = data["usd-coin"]?.mxn; }
      } catch {}
    }

    if (!price) throw new Error("No price source available");

    return NextResponse.json({ usdcMxn: price });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
