"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParticleAuth } from "@particle-network/connectkit";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

interface TxRecord {
  signature: string;
  timestamp: string;
  type: string;
  amount: string;
  status: string;
  token?: string;
}

export function WalletTab() {
  const { getUserInfo } = useParticleAuth();
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [doggyBalance, setDoggyBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [doggyPrice, setDoggyPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"assets" | "historial">("assets");
  const [sortField, setSortField] = useState<string>("balance");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(true);
  const TX_PER_PAGE = 8;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const userInfo = getUserInfo();
  const solWallet = userInfo?.wallets?.find((w) => w.chain_name.toLowerCase().includes("solana"));
  const solAddress = solWallet?.public_address || "";
  const userName = userInfo?.name || "Usuario";
  const userAvatar = userInfo?.avatar || null;

  // Fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const data = await res.json();
        if (data.solana?.usd) setSolPrice(data.solana.usd);
      } catch {}
      // DOGGY price from Jupiter
      try {
        const res = await fetch(`/api/jupiter?inputMint=${DOGGY_MINT}&outputMint=So11111111111111111111111111111111111111112&amount=1000000&slippageBps=100`);
        const data = await res.json();
        if (data.outAmount) setDoggyPrice(Number(data.outAmount) / 1e9 * (solPrice || 0));
      } catch {}
    };
    fetchPrices();
    const i = setInterval(fetchPrices, 60000);
    return () => clearInterval(i);
  }, [solPrice]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!solAddress) return;
    try {
      const connection = new Connection(SOLANA_RPC);
      const sol = await connection.getBalance(new PublicKey(solAddress));
      setSolBalance(sol / 1e9);
      try {
        const mint = new PublicKey(DOGGY_MINT);
        const owner = new PublicKey(solAddress);
        const ata = await getAssociatedTokenAddress(mint, owner);
        const tokenAccount = await getAccount(connection, ata);
        setDoggyBalance(Number(tokenAccount.amount) / 1e6);
      } catch { setDoggyBalance(0); }
      try {
        const usdcMint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        const owner = new PublicKey(solAddress);
        const ata = await getAssociatedTokenAddress(usdcMint, owner);
        const acc = await getAccount(connection, ata);
        setUsdcBalance(Number(acc.amount) / 1e6);
      } catch { setUsdcBalance(0); }
    } catch (err) { console.error("Balance error:", err); }
    finally { setLoading(false); }
  }, [solAddress]);

  useEffect(() => { fetchBalances(); const i = setInterval(fetchBalances, 15000); return () => clearInterval(i); }, [fetchBalances]);

  // Fetch transactions via API route
  const fetchTransactions = useCallback(async (append: boolean = false) => {
    if (!solAddress) return;
    if (activeSubTab !== "historial") return;
    setTxLoading(true);
    try {
      const before = append && transactions.length > 0 ? transactions[transactions.length - 1].signature : undefined;
      const url = `/api/wallet/history?wallet=${solAddress}&limit=25${before ? `&before=${before}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const txs: TxRecord[] = (data.transactions || []).map((t: any) => {
        const date = t.timestamp ? new Date(t.timestamp * 1000).toLocaleString("es-MX", { timeZone: "America/Mexico_City", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A";
        let amount = "";
        if (Math.abs(t.doggyDelta) > 0.001) {
          const delta = (t.type === "Compra" || t.type === "Depósito") ? Math.abs(t.doggyDelta) : t.doggyDelta;
          amount = `${delta > 0 ? "+" : ""}${delta.toFixed(delta < 1 ? 6 : 2)} DOGGY`;
        } else if (Math.abs(t.solDelta) > 0.001) {
          const delta = t.type === "Depósito" ? Math.abs(t.solDelta) : t.solDelta;
          amount = `${delta > 0 ? "+" : ""}${delta.toFixed(4)} SOL`;
        }
        return {
          signature: t.signature,
          timestamp: date,
          type: t.type,
          amount: amount || "—",
          status: "Completado",
        } as TxRecord;
      });

      if (append) {
        setTransactions(prev => [...prev, ...txs]);
      } else {
        setTransactions(txs);
        setTxPage(1);
      }
      setTxHasMore(data.hasMore);
    } catch (err) { console.error("Tx fetch error:", err); }
    finally { setTxLoading(false); }
  }, [solAddress, activeSubTab, transactions.length]);

  useEffect(() => { fetchTransactions(false); }, [fetchTransactions]);

  // Draw PnL chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);
    const midY = h / 2;
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.strokeStyle = "#00C896";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = "rgba(0, 200, 150, 0.06)";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("24h", w - 22, h - 6);
  }, [loading]);

  const copyAddress = () => { if (solAddress) navigator.clipboard.writeText(solAddress); };

  const solUsd = solBalance && solPrice ? solBalance * solPrice : null;
  const doggyUsd = doggyBalance && doggyPrice ? doggyBalance * doggyPrice : null;
  const usdcUsd = usdcBalance || 0;
  const totalUsd = (solUsd || 0) + (doggyUsd || 0) + usdcUsd;

  const assets = [
    { symbol: "SOL", name: "Solana", icon: "◎", price: solPrice, balance: solBalance || 0, available: solBalance || 0, pnl: 0, pnlPercent: 0 },
    { symbol: "DOGGY", name: "DOGGY Token", icon: "🐕", price: doggyPrice, balance: doggyBalance || 0, available: doggyBalance || 0, pnl: 0, pnlPercent: 0 },
    { symbol: "USDC", name: "USD Coin", icon: "💵", price: 1, balance: usdcBalance || 0, available: usdcBalance || 0, pnl: 0, pnlPercent: 0 },
  ];

  const sortedAssets = [...assets].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a] as number;
    const bVal = b[sortField as keyof typeof b] as number;
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const toggleSort = (field: string) => { if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortField(field); setSortDir("desc"); } };
  const SortIcon = ({ field }: { field: string }) => <span className="ml-1 opacity-40">{sortField === field ? (sortDir === "desc" ? "↓" : "↑") : "↕"}</span>;

  const truncated = solAddress ? `${solAddress.slice(0, 4)}...${solAddress.slice(-4)}` : "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* User Header */}
      <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.04) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(255,215,0,0.1)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {userAvatar ? (
              <img src={userAvatar} alt="" className="w-11 h-11 rounded-full object-cover border border-yellow-500/20" />
            ) : (
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "#000" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">{userName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,215,0,0.12)", color: "#FFD700" }}>LV1</span>
              </div>
              <button onClick={copyAddress} className="text-gray-500 text-xs font-mono hover:text-gray-300 transition-colors mt-0.5">
                {truncated} <span className="text-[10px] ml-1 opacity-50">📋</span>
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-[10px] uppercase tracking-wider">Saldo Total</p>
            <p className="text-white text-xl font-bold mt-0.5">${totalUsd.toFixed(2)} <span className="text-xs opacity-40 ml-1">USD</span></p>
          </div>
        </div>
      </div>

      {/* PnL Chart */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-400 text-xs uppercase tracking-wider">PnL</p>
          <span className="text-sm font-semibold" style={{ color: "#00C896" }}>+$0.00</span>
        </div>
        <canvas ref={canvasRef} className="w-full" style={{ height: "100px" }} />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
          {(["assets", "historial"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveSubTab(tab)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{ background: activeSubTab === tab ? "rgba(255,215,0,0.1)" : "transparent", color: activeSubTab === tab ? "#FFD700" : "rgba(255,255,255,0.4)" }}>
              {tab}
            </button>
          ))}
        </div>

        {activeSubTab === "assets" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <button onClick={() => toggleSort("symbol")} className="col-span-3 text-left">Token<SortIcon field="symbol" /></button>
              <button onClick={() => toggleSort("price")} className="col-span-2 text-right">Precio<SortIcon field="price" /></button>
              <button onClick={() => toggleSort("balance")} className="col-span-3 text-right">Balance<SortIcon field="balance" /></button>
              <button onClick={() => toggleSort("available")} className="col-span-2 text-right">Disponible<SortIcon field="available" /></button>
              <div className="col-span-2 text-right">Valor</div>
            </div>
            {sortedAssets.map((asset) => {
              const usdVal = asset.balance * (asset.price || 0);
              return (
                <div key={asset.symbol} className="grid grid-cols-12 gap-2 px-4 py-3 items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div className="col-span-3 flex items-center gap-2">
                    {asset.symbol === "SOL" ? (
                      <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="SOL" className="w-6 h-6 rounded-full" />
                    ) : asset.symbol === "USDC" ? (
                      <img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png" alt="USDC" className="w-6 h-6 rounded-full" />
                    ) : (
                      <img src="/images/doggy-logo.jpg" alt="DOGGY" className="w-6 h-6 rounded-full object-cover" />
                    )}
                    <div>
                      <span className="text-white text-sm font-medium block">{asset.symbol}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-right text-gray-400 text-xs">
                    {loading ? "..." : asset.price ? `$${asset.price < 0.01 ? asset.price.toFixed(6) : asset.price.toFixed(2)}` : "—"}
                  </div>
                  <div className="col-span-3 text-right text-white text-sm font-medium">
                    {loading ? "..." : asset.balance.toLocaleString(undefined, { maximumFractionDigits: asset.balance < 1 ? 6 : 4 })}
                  </div>
                  <div className="col-span-2 text-right text-gray-400 text-xs">
                    {loading ? "..." : asset.available.toLocaleString(undefined, { maximumFractionDigits: asset.available < 1 ? 6 : 4 })}
                  </div>
                  <div className="col-span-2 text-right text-xs" style={{ color: "#FFD700" }}>
                    {loading ? "..." : usdVal > 0 ? `$${usdVal.toFixed(2)}` : "$0.00"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeSubTab === "historial" && (
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="col-span-3">Fecha</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-4 text-right">Monto</div>
              <div className="col-span-3 text-right">Estado</div>
            </div>
            {txLoading && transactions.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm animate-pulse">Cargando...</div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-500 text-sm">No hay transacciones todavía</p>
              </div>
            ) : (
              <>
                {transactions.slice(0, TX_PER_PAGE * txPage).map((tx) => (
                  <div key={tx.signature} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <div className="col-span-3 text-gray-400">{tx.timestamp}</div>
                    <div className="col-span-2 text-gray-300">{tx.type}</div>
                    <div className="col-span-4 text-right font-medium" style={{ color: tx.amount.startsWith("+") ? "#00C896" : "#FF6B6B" }}>
                      {tx.amount}
                    </div>
                    <div className="col-span-3 text-right">
                      <a href={`https://explorer.solana.com/tx/${tx.signature}`} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(0,200,150,0.1)", color: "#00C896" }}>
                        {tx.status}
                      </a>
                    </div>
                  </div>
                ))}
                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-[10px] text-gray-500">
                    {Math.min(TX_PER_PAGE * txPage, transactions.length)} de {transactions.length} txns
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTxPage(p => Math.max(1, p - 1))}
                      disabled={txPage === 1}
                      className="text-[10px] px-3 py-1 rounded-lg disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                      ← Anterior
                    </button>
                    {txHasMore ? (
                      <button
                        onClick={() => { fetchTransactions(true); setTxPage(p => p + 1); }}
                        disabled={txLoading}
                        className="text-[10px] px-3 py-1 rounded-lg disabled:opacity-30"
                        style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>
                        {txLoading ? "Cargando..." : "Cargar más →"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-[10px] px-3 py-1 rounded-lg disabled:opacity-30"
                        style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}>
                        Siguiente →
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {solAddress && (
        <div className="text-center pb-4">
          <a href={`https://explorer.solana.com/address/${solAddress}`} target="_blank" rel="noopener noreferrer"
            className="text-xs hover:underline" style={{ color: "rgba(255,255,255,0.3)" }}>Ver en Solana Explorer →</a>
        </div>
      )}
    </div>
  );
}
