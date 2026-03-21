/**
 * DOGGY OnRamp — Transaction Classifier
 * Stack: Next.js 15 + Solana web3.js + Helius RPC
 *
 * Estrategia:
 * 1. Intentar Helius Enhanced Transactions API (campo `type` directo)
 * 2. Si no hay api-key o falla → fallback a getParsedTransaction con lógica propia
 */

import {
  Connection,
  PublicKey,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

// ─── Constantes del proyecto ──────────────────────────────────────────────────

const DISTRIBUTOR_WALLET = "9bpCT7GdeLekt2tzjjq34NRr7g8ALbxDhE2kSCYTqy71";
const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";

// Program IDs de DEXes en Solana
const DEX_PROGRAM_IDS = new Set([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM v4
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Orca Whirlpool
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter v6
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca v2
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "EewxydAPCCVuNEyrVN68PuSYdQ7wKn27V9Gjeoi8dy3S", // Lifinity
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX", // Serum/OpenBook
  "opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb", // OpenBook v2
]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TxType =
  | "Compra"
  | "Depósito"
  | "Envío"
  | "Swap"
  | "Desconocido";

export interface ClassifiedTransaction {
  signature: string;
  type: TxType;
  doggyDelta: number;
  solDelta: number;
  timestamp: number | null;
  status: string;
  source: "helius" | "rpc-fallback";
}

// ─── Normalización de accountKeys ─────────────────────────────────────────────

function normalizeAccountKey(key: any): string {
  if (typeof key === "string") return key;
  if (key && typeof key === "object" && "pubkey" in key) {
    const pk = key.pubkey;
    if (typeof pk === "string") return pk;
    if (pk instanceof PublicKey) return pk.toString();
    if (pk && typeof pk === "object" && "toString" in pk) return pk.toString();
  }
  if (key instanceof PublicKey) return key.toString();
  if (key && typeof key === "object" && "toString" in key) {
    return key.toString();
  }
  return "";
}

// ─── Calcular deltas ──────────────────────────────────────────────────────────

function getTokenDelta(tx: any, walletAddress: string, mintAddress: string): number {
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];

  const getAmount = (balances: any[], wallet: string, mint: string): number => {
    const entry = balances.find((b: any) => {
      if (b.mint !== mint) return false;
      const keys = tx.transaction.message.accountKeys;
      const acctKey = keys[b.accountIndex];
      return normalizeAccountKey(acctKey) === wallet;
    });
    return entry?.uiTokenAmount?.uiAmount ?? 0;
  };

  return getAmount(post, walletAddress, mintAddress) - getAmount(pre, walletAddress, mintAddress);
}

function getSolDelta(tx: any, walletAddress: string): number {
  const keys = tx.transaction.message.accountKeys;
  const idx = keys.findIndex((k: any) => normalizeAccountKey(k) === walletAddress);
  if (idx === -1) return 0;
  const pre = tx.meta?.preBalances?.[idx] ?? 0;
  const post = tx.meta?.postBalances?.[idx] ?? 0;
  return (post - pre) / 1e9;
}

// ─── Clasificar desde datos RPC (fallback) ────────────────────────────────────

function classifyFromParsedTx(tx: any, userWallet: string): Omit<ClassifiedTransaction, "signature" | "source" | "status"> {
  const keys = tx.transaction.message.accountKeys;
  const normalizedKeys = keys.map((k: any) => normalizeAccountKey(k));
  const timestamp = tx.blockTime ?? null;
  const doggyDelta = getTokenDelta(tx, userWallet, DOGGY_MINT);
  const solDelta = getSolDelta(tx, userWallet);

  // 1. feePayer es distribuidor y recibiste DOGGY → Compra
  const feePayer = normalizedKeys[0];
  if (feePayer === DISTRIBUTOR_WALLET && doggyDelta > 0.001) {
    return { type: "Compra", doggyDelta, solDelta, timestamp };
  }

  // 2. Program ID de DEX en instrucciones → Swap
  const programIds = [
    ...(tx.transaction.message.instructions ?? []),
    ...(tx.meta?.innerInstructions?.flatMap((ii: any) => ii.instructions) ?? []),
  ].map((ix: any) => {
    return ix.programId ? normalizeAccountKey(ix.programId) : (ix.program ?? "");
  });

  if (programIds.some((pid: string) => DEX_PROGRAM_IDS.has(pid))) {
    return { type: "Swap", doggyDelta, solDelta, timestamp };
  }

  // 3. Heurística: SOL y DOGGY en direcciones opuestas → Swap
  if (
    Math.abs(solDelta) > 0.0005 &&
    Math.abs(doggyDelta) > 0.001 &&
    (solDelta > 0) !== (doggyDelta > 0)
  ) {
    return { type: "Swap", doggyDelta, solDelta, timestamp };
  }

  // 4. DOGGY aumentó → Depósito
  if (doggyDelta > 0.001) {
    return { type: "Depósito", doggyDelta, solDelta, timestamp };
  }

  // 5. DOGGY disminuyó → Envío
  if (doggyDelta < -0.001) {
    return { type: "Envío", doggyDelta, solDelta, timestamp };
  }

  // 6. Solo SOL → Deposito o Envio
  if (Math.abs(solDelta) > 0.001) {
    return { type: solDelta > 0 ? "Depósito" : "Envío", doggyDelta, solDelta, timestamp };
  }

  return { type: "Desconocido", doggyDelta, solDelta, timestamp };
}

// ─── Helius Enhanced Transactions API ─────────────────────────────────────────

interface HeliusTransaction {
  signature: string;
  type: string;
  source: string;
  timestamp: number;
  tokenTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    mint: string;
    tokenAmount: number;
  }>;
  nativeTransfers: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    amount: number;
  }>;
}

function mapHeliusType(ht: HeliusTransaction, userWallet: string): TxType {
  const t = ht.type.toUpperCase();

  if (t === "SWAP") return "Swap";

  if (t === "TRANSFER") {
    const doggyTransfer = ht.tokenTransfers.find((tt) => tt.mint === DOGGY_MINT);
    if (!doggyTransfer) {
      // Check if SOL transfer
      const solTransfer = ht.nativeTransfers.find(
        (nt) => nt.toUserAccount === userWallet || nt.fromUserAccount === userWallet
      );
      if (solTransfer) {
        return solTransfer.toUserAccount === userWallet ? "Depósito" : "Envío";
      }
      return "Desconocido";
    }

    if (doggyTransfer.toUserAccount === userWallet) {
      if (doggyTransfer.fromUserAccount === DISTRIBUTOR_WALLET) return "Compra";
      return "Depósito";
    }
    if (doggyTransfer.fromUserAccount === userWallet) return "Envío";
  }

  return "Desconocido";
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function classifyTransactions(
  signatures: string[],
  userWallet: string,
  options: {
    heliusApiKey?: string;
    connection?: Connection;
    rpcUrl?: string;
  } = {}
): Promise<ClassifiedTransaction[]> {

  // ── Rama 1: Helius Enhanced API ────────────────────────────────────────────
  if (options.heliusApiKey && signatures.length > 0) {
    try {
      const url = `https://api.helius.xyz/v0/transactions?api-key=${options.heliusApiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: signatures }),
      });

      if (!res.ok) throw new Error(`Helius HTTP ${res.status}`);

      const heliusTxs: HeliusTransaction[] = await res.json();

      return heliusTxs.map((ht) => ({
        signature: ht.signature,
        type: mapHeliusType(ht, userWallet),
        doggyDelta: 0,
        solDelta: 0,
        timestamp: ht.timestamp,
        status: "Completado",
        source: "helius" as const,
      }));
    } catch (err) {
      console.warn("[classifier] Helius falló, usando RPC fallback:", err);
    }
  }

  // ── Rama 2: RPC Fallback ───────────────────────────────────────────────────
  const connection =
    options.connection ??
    new Connection(
      options.rpcUrl ?? `https://mainnet.helius-rpc.com/?api-key=${options.heliusApiKey ?? ""}`,
      "confirmed"
    );

  const results = await Promise.allSettled(
    signatures.map((sig) =>
      connection.getParsedTransaction(sig, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      })
    )
  );

  return results
    .map((result, i) => {
      const sig = signatures[i];

      if (result.status === "rejected" || !result.value) {
        return null;
      }

      const classified = classifyFromParsedTx(result.value, userWallet);

      return {
        signature: sig,
        ...classified,
        status: "Completado",
        source: "rpc-fallback" as const,
      } as ClassifiedTransaction;
    })
    .filter((r): r is ClassifiedTransaction => r !== null);
}
