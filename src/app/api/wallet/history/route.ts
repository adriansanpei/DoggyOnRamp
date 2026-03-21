import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { classifyTransactions, ClassifiedTransaction, normalizeAccountKey } from "@/lib/transactionClassifier";

export const dynamic = "force-dynamic";

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const DOGGY_MINT = new PublicKey("BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump");

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
    const buyerPubkey = new PublicKey(wallet);

    // Derive buyer's ATA for DOGGY (deterministic, no RPC call)
    const buyerAta = getAssociatedTokenAddressSync(
      DOGGY_MINT,
      buyerPubkey,
      false,
      TOKEN_PROGRAM_ID
    );

    const options: any = { limit };
    if (before) options.until = before;

    // Fetch signatures from both ATA and wallet in parallel
    const [ataResult, walletResult] = await Promise.allSettled([
      connection.getSignaturesForAddress(buyerAta, options),
      connection.getSignaturesForAddress(buyerPubkey, options),
    ]);

    // Deduplicate signatures
    const seen = new Set<string>();
    const sigs: any[] = [];

    const addSigs = (result: PromiseSettledResult<any[]>) => {
      if (result.status === "fulfilled") {
        for (const s of result.value) {
          if (!seen.has(s.signature)) {
            seen.add(s.signature);
            sigs.push(s);
          }
        }
      }
    };

    addSigs(ataResult);
    addSigs(walletResult);

    // Sort by slot descending (most recent first)
    sigs.sort((a, b) => (b.slot || 0) - (a.slot || 0));

    if (sigs.length === 0) {
      return Response.json({ transactions: [], hasMore: false });
    }

    const classified = await classifyTransactions(
      sigs.map((s) => s.signature),
      wallet,
      { heliusApiKey: HELIUS_API_KEY, connection }
    );

    // Fill in doggyDelta and solDelta from RPC if missing (Helius Enhanced doesn't provide them)
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
          const keys = tx.transaction.message.accountKeys;

          // Use normalizeAccountKey for reliable wallet index detection
          const walletIdx = keys.findIndex(
            (k: any) => normalizeAccountKey(k) === wallet
          );

          // Token delta: use 'owner' field (always plain string) for reliability
          const getAmount = (balances: any[], mint: string): number => {
            // Try owner-based lookup first (most reliable)
            const byOwner = balances.find(
              (b: any) => b.mint === mint && b.owner === wallet
            );
            if (byOwner) return byOwner.uiTokenAmount?.uiAmount ?? 0;
            // Fallback: accountIndex
            if (walletIdx >= 0) {
              const byIdx = balances.find(
                (b: any) => b.mint === mint && b.accountIndex === walletIdx
              );
              if (byIdx) return byIdx.uiTokenAmount?.uiAmount ?? 0;
            }
            return 0;
          };

          classified[i].doggyDelta = getAmount(post, DOGGY_MINT.toString()) - getAmount(pre, DOGGY_MINT.toString());

          // SOL delta: must use accountIndex
          if (walletIdx >= 0) {
            const preBal = (tx.meta?.preBalances?.[walletIdx] ?? 0) / 1e9;
            const postBal = (tx.meta?.postBalances?.[walletIdx] ?? 0) / 1e9;
            classified[i].solDelta = postBal - preBal;
          }
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
