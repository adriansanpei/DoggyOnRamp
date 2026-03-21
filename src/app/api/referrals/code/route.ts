import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return NextResponse.json({ error: "wallet required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if code exists
  const { data } = await supabase.from("referral_codes").select("code").eq("wallet_address", wallet).single();

  if (data?.code) {
    return NextResponse.json({ code: data.code });
  }

  // Generate new code
  let code = generateCode();
  let exists = true;
  while (exists) {
    const { data: check } = await supabase.from("referral_codes").select("code").eq("code", code).single();
    if (!check) exists = false;
    else code = generateCode();
  }

  await supabase.from("referral_codes").insert({ wallet_address: wallet, code });
  return NextResponse.json({ code });
}
