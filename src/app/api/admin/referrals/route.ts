import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referrals: data || [] });
}

export async function PATCH(req: NextRequest) {
  const { id, status, note } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const update: any = { status };
  if (status === "qualified") update.qualified_at = new Date().toISOString();
  if (status === "paid") update.paid_at = new Date().toISOString();
  if (note) update.note = note;

  const { data, error } = await supabase.from("referrals").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ referral: data });
}
