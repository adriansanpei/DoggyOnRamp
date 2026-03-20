"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallets, type SolanaChain } from "@particle-network/connectkit";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

const TOKENS = [
  { symbol: "SOL", name: "Solana", mint: SOL_MINT, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", decimals: 9 },
  { symbol: "DOGGY", name: "DOGGY Token", mint: DOGGY_MINT, logo: "/images/doggy-logo.jpg", decimals: 6 },
  { symbol: "USDC", name: "USD Coin", mint: USDC_MINT, logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png", decimals: 6 },
];

interface SwapInstructions {
  computeBudgetInstructions: { programId: string; accounts: any[]; data: string }[];
  setupInstructions: { programId: string; accounts: any[]; data: string }[];
  swapInstruction: { programId: string; accounts: any[]; data: string };
  cleanupInstruction: { programId: string; accounts: any[]; data: string } | null;
  addressLookupTableAddresses: string[];
}

function TokenSelector({ selected, onSelect, balances }: { selected: string; onSelect: (s: string) => void; balances: Record<string, number | null> }) {
  const [open, setOpen] = useState(false);
  const token = TOKENS.find(t => t.symbol === selected)!;
  const bal = balances[selected];

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 transition-colors hover:brightness-110"
        style={{ background: "#252538" }}>
        <img src={token.logo} alt="" className="w-5 h-5 rounded-full object-cover" />
        <span className="text-white text-sm font-medium">{token.symbol}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`opacity-40 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden z-50 py-1"
            style={{ background: "#252538", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {TOKENS.map(t => (
              <button key={t.symbol} onClick={() => { onSelect(t.symbol); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                style={{ background: selected === t.symbol ? "rgba(0,200,150,0.08)" : "transparent" }}
                onMouseEnter={e => (e.target as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => (e.target as HTMLElement).style.background = selected === t.symbol ? "rgba(0,200,150,0.08)" : "transparent"}>
                <img src={t.logo} alt="" className="w-7 h-7 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{t.symbol}</p>
                  <p className="text-gray-500 text-[11px] truncate">{t.name}</p>
                </div>
                <p className="text-gray-400 text-xs shrink-0">
                  {bal !== null ? (t.decimals === 9 ? bal.toFixed(4) : bal.toLocaleString(undefined, { maximumFractionDigits: 2 })) : "..."}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SwapTab() {
  const [primaryWallet] = useWallets();
  let solanaWallet: any = null;
  try { solanaWallet = primaryWallet?.getWalletClient<SolanaChain>(); } catch {}
  const connection = new Connection(SOLANA_RPC);

  const [inputToken, setInputToken] = useState("SOL");
  const [outputToken, setOutputToken] = useState("DOGGY");
  const [inputAmount, setInputAmount] = useState("");
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState("");
  const [txSignature, setTxSignature] = useState("");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [doggyBalance, setDoggyBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);

  const balances: Record<string, number | null> = { SOL: solBalance, DOGGY: doggyBalance, USDC: usdcBalance };
  const inputMint = TOKENS.find(t => t.symbol === inputToken)?.mint || "";
  const outputMint = TOKENS.find(t => t.symbol === outputToken)?.mint || "";
  const inputDecimals = TOKENS.find(t => t.symbol === inputToken)?.decimals || 6;
  const outputDecimals = TOKENS.find(t => t.symbol === outputToken)?.decimals || 6;

  useEffect(() => {
    if (!solanaWallet) return;
    const fetch = async () => {
      try {
        const sol = await connection.getBalance(solanaWallet.publicKey);
        setSolBalance(sol / 1e9);
        const { getAssociatedTokenAddress, getAccount } = await import("@solana/spl-token");
        for (const { mint, symbol } of TOKENS.filter(t => t.symbol !== "SOL")) {
          try {
            const ata = await getAssociatedTokenAddress(new PublicKey(mint), solanaWallet.publicKey);
            const acc = await getAccount(connection, ata);
            const fn = symbol === "DOGGY" ? setDoggyBalance : setUsdcBalance;
            fn(Number(acc.amount) / 1e6);
          } catch { const fn = symbol === "DOGGY" ? setDoggyBalance : setUsdcBalance; fn(0); }
        }
      } catch {}
    };
    fetch();
    const i = setInterval(fetch, 15000);
    return () => clearInterval(i);
  }, [solanaWallet, connection]);

  const fetchQuote = useCallback(async () => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || inputMint === outputMint) { setQuote(null); return; }
    setLoading(true); setError("");
    try {
      const rawAmount = Math.floor(parseFloat(inputAmount) * Math.pow(10, inputDecimals));
      const params = new URLSearchParams({ inputMint, outputMint, amount: rawAmount.toString(), slippageBps: "100" });
      const res = await fetch(`/api/jupiter?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.errorMessage || "Error");
      setQuote(data);
    } catch (err: any) { setError(err.message || "Error"); setQuote(null); }
    finally { setLoading(false); }
  }, [inputAmount, inputMint, outputMint, inputDecimals]);

  useEffect(() => { const t = setTimeout(fetchQuote, 500); return () => clearTimeout(t); }, [fetchQuote]);

  const handleSwap = async () => {
    if (!quote || !solanaWallet || !connection) return;
    setSwapping(true); setError("");
    try {
      const swapRes = await fetch("/api/jupiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteResponse: quote, userPublicKey: solanaWallet.publicKey.toString(), wrapAndUnwrapSol: true, dynamicComputeUnitLimit: true, prioritizationFeeLamports: "auto" }),
      });
      if (!swapRes.ok) { const e = await swapRes.json().catch(() => ({})); throw new Error(e.error || "Error"); }
      const instructions: SwapInstructions = await swapRes.json();
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      const tx = new Transaction();
      tx.recentBlockhash = blockhash;
      tx.feePayer = solanaWallet.publicKey;
      const addIx = (ix: any) => tx.add(new TransactionInstruction({
        programId: new PublicKey(ix.programId),
        keys: ix.accounts.map((a: any) => ({ pubkey: new PublicKey(a.pubkey), isSigner: a.isSigner, isWritable: a.isWritable })),
        data: Buffer.from(ix.data, "base64"),
      }));
      instructions.computeBudgetInstructions.forEach(addIx);
      instructions.setupInstructions.forEach(addIx);
      addIx(instructions.swapInstruction);
      if (instructions.cleanupInstruction) addIx(instructions.cleanupInstruction);
      const { signature } = await solanaWallet.sendTransaction(tx);
      setTxSignature(signature);
      setInputAmount(""); setQuote(null);
    } catch (err: any) { setError(err.message || "Error"); }
    finally { setSwapping(false); }
  };

  const formatOutput = () => {
    if (!quote) return "0";
    return (Number(quote.outAmount) / Math.pow(10, outputDecimals)).toLocaleString(undefined, { maximumFractionDigits: outputToken === "SOL" ? 4 : 2 });
  };

  const setMax = () => {
    const bal = balances[inputToken];
    if (bal === null || bal <= 0) return;
    setInputAmount(inputToken === "SOL" ? Math.max(0, bal - 0.01).toFixed(4) : bal.toString());
  };

  const handleInputSelect = (sym: string) => { if (sym === outputToken) setOutputToken(inputToken); setInputToken(sym); setInputAmount(""); setQuote(null); setTxSignature(""); setError(""); };
  const handleOutputSelect = (sym: string) => { if (sym === inputToken) setInputToken(outputToken); setOutputToken(sym); setInputAmount(""); setQuote(null); setTxSignature(""); setError(""); };
  const handleSwapTokens = () => { const tmp = inputToken; setInputToken(outputToken); setOutputToken(tmp); setInputAmount(""); setQuote(null); setTxSignature(""); setError(""); };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.06)" }}>

        {/* Sell Panel */}
        <div className="rounded-xl p-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium">Sell</span>
            <span className="text-gray-500 text-[11px]">
              Balance: {balances[inputToken] !== null ? (inputToken === "SOL" ? balances[inputToken]!.toFixed(4) : balances[inputToken]!.toLocaleString(undefined, { maximumFractionDigits: 2 })) : "..."} {inputToken}
              <button onClick={setMax} className="ml-2 text-[10px] font-semibold" style={{ color: "#00C896" }}>MAX</button>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector selected={inputToken} onSelect={handleInputSelect} balances={balances} />
            <input type="number" placeholder="0.00" value={inputAmount} onChange={(e) => { setInputAmount(e.target.value); setTxSignature(""); setError(""); }}
              className="flex-1 bg-transparent text-white text-2xl font-light text-right outline-none placeholder-gray-600 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center -my-2 relative z-30">
          <button onClick={handleSwapTokens}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ background: "#1a1b2e", border: "3px solid #13141f" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V13M7 1L12 6M7 1L2 6" stroke="#00C896" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 13V1M7 13L12 8M7 13L2 8" stroke="rgba(0,200,150,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Buy Panel */}
        <div className="rounded-xl p-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium">Buy</span>
            <span className="text-gray-500 text-[11px]">
              Balance: {balances[outputToken] !== null ? (outputToken === "SOL" ? balances[outputToken]!.toFixed(4) : balances[outputToken]!.toLocaleString(undefined, { maximumFractionDigits: 2 })) : "..."} {outputToken}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector selected={outputToken} onSelect={handleOutputSelect} balances={balances} />
            <div className="flex-1 text-right">
              <p className="text-white text-2xl font-light">
                {inputMint === outputMint ? <span className="text-gray-600">—</span> : loading ? <span className="animate-pulse text-gray-600">...</span> : formatOutput()}
              </p>
            </div>
          </div>
        </div>

        {/* Quote Info */}
        {quote && !error && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Rate: 1 {inputToken} = {Number(quote.outAmount) > 0 ? ((Number(quote.outAmount) * Math.pow(10, inputDecimals)) / (Number(quote.inAmount) * Math.pow(10, outputDecimals))).toFixed(6) : "—"} {outputToken}</span>
            </div>
            <span className={Number(quote.priceImpactPct) > 1 ? "text-red-400 text-xs" : "text-green-400/60 text-xs"}>
              {Number(quote.priceImpactPct).toFixed(3)}%
            </span>
          </div>
        )}

        {error && <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.1)" }}>{error}</div>}

        {txSignature && (
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(0,200,150,0.06)", border: "1px solid rgba(0,200,150,0.1)" }}>
            <span className="text-green-400 font-medium">✅ Swap exitoso · </span>
            <a href={`https://explorer.solana.com/tx/${txSignature}`} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "rgba(0,200,150,0.7)" }}>Ver tx</a>
          </div>
        )}

        <button onClick={handleSwap} disabled={!quote || swapping || !inputAmount || inputMint === outputMint}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-25"
          style={{
            background: quote && !swapping && inputAmount && inputMint !== outputMint ? "#00C896" : "rgba(255,255,255,0.05)",
            color: quote && !swapping && inputAmount && inputMint !== outputMint ? "#000" : "rgba(255,255,255,0.3)",
            boxShadow: quote && !swapping && inputAmount && inputMint !== outputMint ? "0 4px 20px rgba(0,200,150,0.25)" : "none",
          }}>
          {swapping ? "Procesando..." : "Swap"}
        </button>
      </div>
      <p className="text-center text-gray-600 text-[10px] mt-3">Powered by Jupiter</p>
    </div>
  );
}
