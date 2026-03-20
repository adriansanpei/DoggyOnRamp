import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PUT(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: order, error } = await supabase
      .from("doggy_orders")
      .update({ status: "payment_reported" })
      .eq("id", orderId)
      .eq("status", "pending")
      .select()
      .single();

    if (error || !order) return NextResponse.json({ error: "Order not found or not pending" }, { status: 404 });

    return NextResponse.json({ ok: true, order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
