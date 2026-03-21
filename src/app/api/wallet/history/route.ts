import { Connection, PublicKey } from "@solana/web3.js";
import { classifyTransactions, ClassifiedTransaction } from "@/lib/transactionClassifier";

export const dynamic = "force-dynamic";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  const limit = parseInt(searchParams.get("limit") || "25");
  const before = searchParams.get("before") || undefined;

  if (!wallet) {
    return Response.json({ error: "wallet requerida" }, { status: 400 });
  }

  try {
    const connection = new Connection(SOLANA_RPC, "confirmed");

    const options: any = { limit };
    if (before) options.until = before;

    const sigs = await connection.getSignaturesForAddress(
      new PublicKey(wallet),
      options
    );

    if (sigs.length === 0) {
      return Response.json({ transactions: [], hasMore: false });
    }

    const classified = await classifyTransactions(
      sigs.map((s) => s.signature),
      wallet,
      { heliusApiKey: HELIUS_API_KEY, connection }
    );

    // Fill in doggyDelta and solDelta from Helius if missing
    if (classified.some((t) => t.source === "helius")) {
      const results = await Promise.allSettled(
        sigs.map((sig) =>
          connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          })
        )
      );

      results.forEach((result, i) => {
        if (result.status === "fulfilled" && result.value) {
          const tx = result.value;
          const pre = tx.meta?.preTokenBalances ?? [];
          const post = tx.meta?.postTokenBalances ?? [];
          const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
          const keys = tx.transaction.message.accountKeys;

          // Find which accountKey index belongs to our wallet
          const walletIdx = keys.findIndex((k: any) => {
            const pk = typeof k === "string" ? k : k?.pubkey?.toString?.() || k?.toString?.() || "";
            return pk === wallet;
          });

          // Get token amount for our wallet specifically (by accountIndex)
          const getAmount = (balances: any[], mint: string): number => {
            const entry = balances.find((b: any) => b.mint === mint && b.accountIndex === walletIdx);
            return entry?.uiTokenAmount?.uiAmount ?? 0;
          };

          const doggyDelta = getAmount(post, DOGGY_MINT) - getAmount(pre, DOGGY_MINT);

          let solDelta = 0;
          if (walletIdx >= 0) {
            const preBal = (tx.meta?.preBalances?.[walletIdx] ?? 0) / 1e9;
            const postBal = (tx.meta?.postBalances?.[walletIdx] ?? 0) / 1e9;
            solDelta = postBal - preBal;
          }

          classified[i].doggyDelta = doggyDelta;
          classified[i].solDelta = solDelta;
        }
      });
    }

    // Filter out unknown/dust
    const clean = classified.filter(
      (t) =>
        t.type !== "Desconocido" &&
        (Math.abs(t.doggyDelta) > 0.001 || Math.abs(t.solDelta) > 0.001)
    );

    return Response.json({
      transactions: clean,
      hasMore: sigs.length >= limit,
    });
  } catch (err) {
    console.error("[wallet/history]", err);
    return Response.json({ error: "Error fetching history" }, { status: 500 });
  }
}
