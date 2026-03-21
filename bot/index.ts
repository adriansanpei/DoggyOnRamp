import TelegramBot from "node-telegram-bot-api";
import { createClient } from "@supabase/supabase-js";
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import bs58 from "bs58";
import express from "express";

// === ENV ===
const BOT_TOKEN = process.env.HACKATHON_TELEGRAM_BOT_TOKEN!;
const ADMIN_CHAT_ID = parseInt(process.env.ADMIN_CHAT_ID || "2137908952");
const SUPABASE_URL = process.env.HACKATHON_SUPABASE_URL!;
const SUPABASE_KEY = process.env.HACKATHON_SUPABASE_SERVICE_KEY!;
const RPC_URL = process.env.HACKATHON_SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const DISTRIBUTOR_PRIVATE_KEY = process.env.HACKATHON_DOGGY_DISTRIBUTOR_KEY!;
const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
const BOT_PORT = parseInt(process.env.BOT_PORT || "3100");

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const connection = new Connection(RPC_URL, "confirmed");
const distributorKeypair = Keypair.fromSecretKey(bs58.decode(DISTRIBUTOR_PRIVATE_KEY));

// === BOT SETUP ===
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// === HELPER: Send DOGGY ===
async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch("https://api.binance.us/api/v3/ticker/price?symbol=SOLUSDC");
    if (res.ok) { const data: any = await res.json(); return parseFloat(data.price); }
  } catch {}
  return 150; // fallback
}

async function sendDoggy(buyerWallet: string, doggyAmount: number, orderId: string, solUsd?: number): Promise<string | null> {
  try {
    const buyerPk = new PublicKey(buyerWallet);
    const mintPk = new PublicKey(DOGGY_MINT);

    const fromAta = await getAssociatedTokenAddress(mintPk, distributorKeypair.publicKey);
    const toAta = await getAssociatedTokenAddress(mintPk, buyerPk);

    const tx = new Transaction();

    // Create ATA for buyer if it doesn't exist
    try {
      await getAccount(connection, toAta);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          distributorKeypair.publicKey,
          toAta,
          buyerPk,
          mintPk,
          TOKEN_PROGRAM_ID
        )
      );
    }

    // DOGGY transfer
    tx.add(
      createTransferInstruction(fromAta, toAta, distributorKeypair.publicKey, Math.floor(doggyAmount * 1e6), [], TOKEN_PROGRAM_ID)
    );

    // SOL transfer for gas if requested
    if (solUsd && solUsd > 0) {
      const solPrice = await getSolPrice();
      const solAmount = solUsd / solPrice;
      tx.add(
        SystemProgram.transfer({
          fromPubkey: distributorKeypair.publicKey,
          toPubkey: buyerPk,
          lamports: Math.floor(solAmount * 1_000_000_000),
        })
      );
    }

    const sig = await connection.sendTransaction(tx, [distributorKeypair]);
    await connection.confirmTransaction(sig, "confirmed");

    // Update order
    await supabase
      .from("doggy_orders")
      .update({ status: "completed", solana_tx_signature: sig })
      .eq("id", orderId);

    // Auto-qualify referral if buyer has $X MXN in completed orders (from bot_config)
    try {
      const { data: cfg } = await supabase.from("bot_config").select("key, value").eq("key", "referral_min_mxn").single();
      const minMxn = cfg ? parseFloat(cfg.value) : 300;

      const { data: buyerReferral } = await supabase
        .from("referrals")
        .select("id, status")
        .eq("referred_wallet", buyerWallet)
        .eq("status", "pending")
        .single();

      if (buyerReferral) {
        const { data: buyerOrders } = await supabase
          .from("doggy_orders")
          .select("mxn_amount")
          .eq("user_wallet", buyerWallet)
          .eq("status", "completed");

        const totalMxn = (buyerOrders || []).reduce((s: number, o: any) => s + (parseFloat(o.mxn_amount) || 0), 0);
        if (totalMxn >= minMxn) {
          await supabase.from("referrals").update({ status: "qualified", qualified_at: new Date().toISOString() }).eq("id", buyerReferral.id);
          console.log(`Referral ${buyerReferral.id} auto-qualified ($${totalMxn.toFixed(2)} MXN >= $${minMxn} MXN)`);
        }
      }
    } catch (e) { console.error("Auto-qualify error:", e); }

    return sig;
  } catch (err: any) {
    console.error("sendDoggy error:", err);
    return null;
  }
}

// === COMMANDS ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "🐕 *DOGGY OnRamp Bot*\n\nComandos:\n/start - Inicio\n/orders - Órdenes pendientes\n/stats - Estadísticas", { parse_mode: "Markdown" });
});

bot.onText(/\/orders/, async (msg) => {
  const { data: orders } = await supabase
    .from("doggy_orders")
    .select("*")
    .in("status", ["pending", "payment_reported"])
    .order("created_at", { ascending: false })
    .limit(10);

  if (!orders?.length) {
    return bot.sendMessage(msg.chat.id, "📭 No hay órdenes pendientes.");
  }

  const text = orders.map((o: any) =>
    `🆔 ${o.id.slice(0, 8)}... | $${o.mxn_amount} MXN → ${o.doggy_amount} DOGGY | Status: ${o.status} | Wallet: ${o.user_wallet?.slice(0, 8)}...`
  ).join("\n");

  bot.sendMessage(msg.chat.id, `📋 *Órdenes pendientes:*\n\n${text}`, { parse_mode: "Markdown" });
});

bot.onText(/\/stats/, async (msg) => {
  const { data: completed } = await supabase.from("doggy_orders").select("mxn_amount, doggy_amount").eq("status", "completed");
  const { count: total } = await supabase.from("doggy_orders").select("*", { count: "exact", head: true });

  const totalMxn = completed?.reduce((s: number, o: any) => s + (o.mxn_amount || 0), 0) || 0;
  const totalDoggy = completed?.reduce((s: number, o: any) => s + (o.doggy_amount || 0), 0) || 0;

  bot.sendMessage(msg.chat.id,
    `📊 *Stats DOGGY OnRamp*\n\n` +
    `📦 Total órdenes: ${total}\n` +
    `✅ Completadas: ${completed?.length || 0}\n` +
    `💰 MXN recibido: $${totalMxn.toFixed(2)}\n` +
    `🐕 DOGGY enviado: ${totalDoggy.toLocaleString()}`,
    { parse_mode: "Markdown" }
  );
});

// === INLINE BUTTON HANDLERS ===
bot.on("callback_query", async (query) => {
  if (!query.data || !query.message) return;
  const chatId = query.message.chat.id;
  const data = query.data;

  await bot.answerCallbackQuery(query.id);

  if (data.startsWith("c:")) {
    // Confirm payment - search by partial ID
    const partialId = data.slice(2);
    const { data: orders } = await supabase.rpc("search_orders_by_id_prefix", { p_prefix: partialId });
    if (!orders?.length) return bot.sendMessage(chatId, "❌ Orden no encontrada.");
    const order = orders[0];

    const shortId = order.id.slice(-6).toUpperCase();
    const solInfo = order.sol_usd ? `\n💾 ${order.sol_usd} USD en SOL para gas` : "";
    bot.sendMessage(chatId, `⏳ Enviando ${order.doggy_amount} DOGGY${order.sol_usd ? ` + ${order.sol_usd} USD en SOL` : ""} a ${order.user_wallet?.slice(0, 8)}... [${shortId}]`);

    const sig = await sendDoggy(order.user_wallet, order.doggy_amount, order.id, order.sol_usd);
    if (sig) {
      bot.sendMessage(chatId,
        `✅ *DOGGY enviado!* [${shortId}]\n\n` +
        `🐕 ${order.doggy_amount} DOGGY${solInfo}\n` +
        `👤 ${order.user_wallet}\n` +
        `📝 [Ver TX](https://explorer.solana.com/tx/${sig})`,
        { parse_mode: "Markdown" }
      );
    } else {
      bot.sendMessage(chatId, `❌ Error enviando DOGGY. Verifica que el distributor tenga balance y la ATA existe.`);
    }
  }

  if (data.startsWith("x:")) {
    const partialId = data.slice(2);
    const { data: orders } = await supabase.rpc("search_orders_by_id_prefix", { p_prefix: partialId });
    if (!orders?.length) return bot.sendMessage(chatId, "❌ Orden no encontrada.");
    await supabase.from("doggy_orders").update({ status: "cancelled" }).eq("id", orders[0].id);
    bot.sendMessage(chatId, `❌ Orden cancelada. [${orders[0].id.slice(-6).toUpperCase()}]`);
  }
});

// === SUPABASE REALTIME ===
async function setupRealtime() {
  supabase
    .channel("doggy-orders-changes")
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "doggy_orders",
    }, async (payload: any) => {
      const order = payload.new;
      if (!order) return;

      if (payload.eventType === "INSERT" && order.status === "pending") {
        const shortId = order.id.slice(-6).toUpperCase();
        const solLine = order.sol_usd ? `\n💾 SOL: $${order.sol_usd} USD ($${order.sol_mxn?.toFixed(2)} MXN)` : "";
        bot.sendMessage(ADMIN_CHAT_ID,
          `🆕 *Nueva orden DOGGY* [${shortId}]\n\n` +
          `💰 MXN: $${order.mxn_amount}\n` +
          `🐕 DOGGY: ${order.doggy_amount}\n` +
          solLine +
          `💵 Monto SPEI: $${order.exact_amount?.toFixed(2)}\n` +
          `👤 Wallet: ${order.user_wallet}`,
          { parse_mode: "Markdown" }
        );
      }

      if (payload.eventType === "UPDATE" && order.status === "payment_reported") {
        const shortId = order.id.slice(-6).toUpperCase();
        const solLine = order.sol_usd ? ` + $${order.sol_usd} USD SOL` : "";
        bot.sendMessage(ADMIN_CHAT_ID,
          `💳 *Pago reportado* [${shortId}]\n\n` +
          `💰 $${order.mxn_amount} MXN → ${order.doggy_amount} DOGGY${solLine}\n` +
          `💵 Monto SPEI: $${order.exact_amount?.toFixed(2)}\n` +
          `👤 ${order.user_wallet}\n\n` +
          `¿El pago SPEI llegó?`,
          {
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Sí, llegó", callback_data: `c:${order.id.slice(0,8)}` },
                  { text: "❌ No", callback_data: `x:${order.id.slice(0,8)}` },
                ],
              ],
            },
          }
        );
      }
    })
    .subscribe();

  console.log("✅ Supabase realtime connected, listening to doggy_orders");
}

// === HTTP ENDPOINT (backup for direct webhooks) ===
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  const { type, orderId } = req.body;
  if (!type || !orderId) return res.status(400).json({ error: "Missing fields" });

  const { data: order } = await supabase.from("doggy_orders").select("*").eq("id", orderId).single();
  if (!order) return res.status(404).json({ error: "Not found" });

  if (type === "order_created") {
    bot.sendMessage(ADMIN_CHAT_ID,
      `🆕 *Nueva orden DOGGY*\n\n💰 $${order.mxn_amount} MXN → ${order.doggy_amount} DOGGY\n👤 ${order.user_wallet}`,
      { parse_mode: "Markdown" }
    );
  } else if (type === "payment_reported") {
    bot.sendMessage(ADMIN_CHAT_ID,
      `💳 *Pago reportado* — $${order.mxn_amount} MXN\n¿Llegó el SPEI?`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "✅ Sí, llegó", callback_data: JSON.stringify({ action: "confirm_payment", orderId: order.id }) },
              { text: "❌ No", callback_data: JSON.stringify({ action: "cancel_payment", orderId: order.id }) },
            ],
          ],
        },
      }
    );
  }

  res.json({ ok: true });
});

// === START ===
setupRealtime();
app.listen(BOT_PORT, () => console.log(`🤖 Bot HTTP listening on port ${BOT_PORT}`));
console.log("🐕 DOGGY Telegram Bot started!");
