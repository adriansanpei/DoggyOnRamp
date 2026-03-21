import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await supabase.from("bot_config").select("*");
  const config: Record<string, string> = {};
  (data || []).forEach((r: any) => { config[r.key] = r.value; });
  return NextResponse.json({ config });
}

export async function PUT(req: NextRequest) {
  const { key, value } = await req.json();
  if (!key || value === undefined) return NextResponse.json({ error: "missing fields" }, { status: 400 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { error } = await supabase.from("bot_config").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
