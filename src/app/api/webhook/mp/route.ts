import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount, createTransferInstruction } from "@solana/spl-token";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN!;
const DISTRIBUTOR_PRIVATE_KEY = process.env.DOGGY_DISTRIBUTOR_PRIVATE_KEY!;
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MP sends different event types
    if (body.action !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return NextResponse.json({ ok: true });

    // Verify payment status with MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    // Only process approved payments
    if (payment.status !== "approved") {
      console.log(`Payment ${paymentId} status: ${payment.status} - skipping`);
      return NextResponse.json({ ok: true });
    }

    // Parse external reference
    const externalRef = JSON.parse(payment.external_reference || "{}");
    const { userWallet, doggyAmount, particleUserId } = externalRef;
    if (!userWallet || !doggyAmount) {
      console.error("Missing external_reference data", paymentId);
      return NextResponse.json({ error: "Missing reference data" }, { status: 400 });
    }

    console.log(`Payment approved! Sending ${doggyAmount} DOGGY to ${userWallet}`);

    // Send DOGGY from distributor wallet to user
    const connection = new Connection(SOLANA_RPC);
    const { Keypair } = await import("@solana/web3.js");
    let secretKey: Uint8Array;
    try {
      // Try JSON array format first (Phantom export)
      secretKey = new Uint8Array(JSON.parse(DISTRIBUTOR_PRIVATE_KEY));
    } catch {
      // Try base58 using bs58
      const bs58 = (await import("bs58")).default;
      secretKey = bs58.decode(DISTRIBUTOR_PRIVATE_KEY);
    }
    const keypair = Keypair.fromSecretKey(secretKey);

    const fromAta = await getAssociatedTokenAddress(new PublicKey(DOGGY_MINT), keypair.publicKey);
    const toAta = await getAssociatedTokenAddress(new PublicKey(DOGGY_MINT), new PublicKey(userWallet));

    // Check distributor has enough DOGGY
    try {
      const fromAcc = await getAccount(connection, fromAta);
      const rawAmount = Math.floor(parseFloat(doggyAmount) * 1e6);
      if (Number(fromAcc.amount) < rawAmount) {
        console.error(`Insufficient DOGGY. Have: ${fromAcc.amount}, Need: ${rawAmount}`);
        return NextResponse.json({ error: "Insufficient DOGGY balance" }, { status: 500 });
      }
    } catch (err) {
      console.error("Distributor DOGGY account not found:", err);
      return NextResponse.json({ error: "Distributor has no DOGGY" }, { status: 500 });
    }

    // Create and send transfer transaction
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const tx = new Transaction().add(
      createTransferInstruction(fromAta, toAta, keypair.publicKey, Math.floor(parseFloat(doggyAmount) * 1e6))
    );
    tx.recentBlockhash = blockhash;
    tx.feePayer = keypair.publicKey;

    const signature = await connection.sendTransaction(tx, [keypair]);

    console.log(`DOGGY sent! Tx: ${signature}`);

    // Store in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("doggy_orders").insert({
      particle_user_id: particleUserId,
      user_wallet: userWallet,
      mxn_amount: externalRef.mxnAmount,
      doggy_amount: doggyAmount,
      usdc_amount: externalRef.usdcAmount,
      usdc_mxn_rate: null,
      mp_payment_id: paymentId,
      solana_tx_signature: signature,
      status: "completed",
    });

    return NextResponse.json({ ok: true, signature });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Mercado Pago also sends GET for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "webhook active" });
}
