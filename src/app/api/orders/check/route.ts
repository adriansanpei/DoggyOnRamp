import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN!;

// Check single order: also search MP for matching payment
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: order } = await supabase.from("doggy_orders").select("*").eq("id", id).single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // If still pending, search MP for matching payment
    if (order.status === "pending") {
      const mpRes = await fetch(
        "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria.desc&limit=20&range=date_created&begin_date=" +
        new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );
      const mpData = await mpRes.json();
      const payments = mpData.results || [];

      const match = payments.find((p: any) => {
        return p.status === "approved" &&
          Math.abs(parseFloat(p.transaction_amount) - order.exact_amount) < 0.01;
      });

      if (match) {
        // Found match - send DOGGY
        const sendResult = await sendDoggy(order.user_wallet, order.doggy_amount);
        if (sendResult.success) {
          await supabase.from("doggy_orders").update({
            status: "completed",
            mp_payment_id: String(match.id),
            solana_tx_signature: sendResult.signature,
            completed_at: new Date().toISOString(),
          }).eq("id", order.id);
          return NextResponse.json({ status: "completed", solana_tx_signature: sendResult.signature });
        }
      }
    }

    return NextResponse.json({ status: order.status, solana_tx_signature: order.solana_tx_signature });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Cron endpoint: check all pending orders against MP movements
export async function POST(req: NextRequest) {
  try {
    // Verify this is called by cron (simple secret check)
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all pending orders
    const { data: pendingOrders, error } = await supabase
      .from("doggy_orders")
      .select("*")
      .eq("status", "pending")
      .gt("created_at", new Date(Date.now() - 15 * 60 * 1000).toISOString()); // Only last 15 min

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({ message: "No pending orders", processed: 0 });
    }

    // Fetch recent MP movements (last 15 min)
    const mpRes = await fetch(
      "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria.desc&limit=50&range=date_created&begin_date=" +
      new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );
    const mpData = await mpRes.json();
    const payments = mpData.results || [];

    // Match payments to orders
    let processed = 0;
    for (const order of pendingOrders) {
      const exactStr = order.exact_amount?.toFixed(3);
      const match = payments.find((p: any) => {
        return p.status === "approved" &&
          Math.abs(parseFloat(p.transaction_amount) - order.exact_amount) < 0.01;
      });

      if (match) {
        // Found matching payment! Send DOGGY
        const sendResult = await sendDoggy(order.user_wallet, order.doggy_amount);
        if (sendResult.success) {
          await supabase.from("doggy_orders").update({
            status: "completed",
            mp_payment_id: String(match.id),
            solana_tx_signature: sendResult.signature,
            completed_at: new Date().toISOString(),
          }).eq("id", order.id);
          processed++;
          console.log(`Order ${order.id} completed! Sent ${order.doggy_amount} DOGGY to ${order.user_wallet}`);
        } else {
          console.error(`Order ${order.id}: Failed to send DOGGY:`, sendResult.error);
        }
      }
    }

    return NextResponse.json({ message: `Processed ${processed} of ${pendingOrders.length} orders`, processed });
  } catch (err: any) {
    console.error("Check orders error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendDoggy(userWallet: string, doggyAmount: number): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
    const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const DISTRIBUTOR_KEY = process.env.DOGGY_DISTRIBUTOR_PRIVATE_KEY!;

    const { Connection, PublicKey, Transaction } = await import("@solana/web3.js");
    const { getAssociatedTokenAddress, getAccount, createTransferInstruction } = await import("@solana/spl-token");

    let secretKey: Uint8Array;
    try {
      secretKey = new Uint8Array(JSON.parse(DISTRIBUTOR_KEY));
    } catch {
      const bs58 = (await import("bs58")).default;
      secretKey = bs58.decode(DISTRIBUTOR_KEY);
    }

    const { Keypair } = await import("@solana/web3.js");
    const keypair = Keypair.fromSecretKey(secretKey);
    const connection = new Connection(SOLANA_RPC);

    const fromAta = await getAssociatedTokenAddress(new PublicKey(DOGGY_MINT), keypair.publicKey);
    const toAta = await getAssociatedTokenAddress(new PublicKey(DOGGY_MINT), new PublicKey(userWallet));

    // Check balance
    try {
      const fromAcc = await getAccount(connection, fromAta);
      if (Number(fromAcc.amount) < Math.floor(doggyAmount * 1e6)) {
        return { success: false, error: "Insufficient DOGGY" };
      }
    } catch {
      return { success: false, error: "No DOGGY account" };
    }

    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction().add(
      createTransferInstruction(fromAta, toAta, keypair.publicKey, Math.floor(doggyAmount * 1e6))
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;

    const signature = await connection.sendTransaction(tx, [keypair]);
    return { success: true, signature };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
