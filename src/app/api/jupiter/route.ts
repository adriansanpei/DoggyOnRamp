import { NextRequest, NextResponse } from "next/server";

const JUP_BASE = "https://public.jupiterapi.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") || "100";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({ inputMint, outputMint, amount, slippageBps });
    const res = await fetch(`${JUP_BASE}/quote?${params}`);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(errData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Proxy error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${JUP_BASE}/swap-instructions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(errData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Proxy error" }, { status: 500 });
  }
}
