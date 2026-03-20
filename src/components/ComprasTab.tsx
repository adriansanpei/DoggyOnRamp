"use client";

import { useState, useEffect, useCallback } from "react";
import { useParticleAuth } from "@particle-network/connectkit";

const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
const DOGGY_LOGO = "/images/doggy-logo.jpg";
const MXN_LOGO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#006847"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">$</text></svg>');

const CLABE = process.env.NEXT_PUBLIC_CLABE || "";
const BENEFICIARIO = process.env.NEXT_PUBLIC_BENEFICIARIO || "DOGGY";
const ORDER_EXPIRY_MINUTES = 10;

export function ComprasTab() {
  const { getUserInfo } = useParticleAuth();
  const [mxnAmount, setMxnAmount] = useState("");
  const [usdcMxn, setUsdcMxn] = useState<number | null>(null);
  const [doggyPriceUsd, setDoggyPriceUsd] = useState<number | null>(null);
  const [doggyAmount, setDoggyAmount] = useState<string | null>(null);
  const [usdcAmount, setUsdcAmount] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [userWallet, setUserWallet] = useState("");

  // Order state
  const [step, setStep] = useState<"input" | "payment" | "success">("input");
  const [order, setOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    try {
      const userInfo = getUserInfo();
      const solWallet = userInfo?.wallets?.find((w: any) => w.chain_name.toLowerCase().includes("solana"));
      if (solWallet) setUserWallet(solWallet.public_address || "");
    } catch {}
  }, [getUserInfo]);

  // Fetch USDC/MXN rate
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        if (data.usdcMxn) setUsdcMxn(data.usdcMxn);
      } catch {}
    };
    fetchPrice();
    const iv = setInterval(fetchPrice, 60000);
    return () => clearInterval(iv);
  }, []);

  // Fetch DOGGY price
  useEffect(() => {
    const fetchDoggyPrice = async () => {
      try {
        const res = await fetch(`/api/jupiter?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=${DOGGY_MINT}&amount=1000000&slippageBps=100`);
        const data = await res.json();
        if (data.outAmount) setDoggyPriceUsd(1e6 / Number(data.outAmount));
      } catch {}
    };
    fetchDoggyPrice();
    const iv = setInterval(fetchDoggyPrice, 30000);
    return () => clearInterval(iv);
  }, []);

  // Calculate DOGGY amount
  useEffect(() => {
    if (!mxnAmount || !usdcMxn || !doggyPriceUsd) { setDoggyAmount(null); setUsdcAmount(null); return; }
    const mxn = parseFloat(mxnAmount);
    if (mxn <= 0) { setDoggyAmount(null); setUsdcAmount(null); return; }
    const usdc = mxn / usdcMxn;
    const doggy = usdc / doggyPriceUsd;
    setUsdcAmount(usdc.toFixed(2));
    setDoggyAmount(doggy.toLocaleString(undefined, { maximumFractionDigits: 2 }));
  }, [mxnAmount, usdcMxn, doggyPriceUsd]);

  // Timer countdown
  useEffect(() => {
    if (step !== "payment" || !order) return;
    const iv = setInterval(() => {
      const elapsed = (Date.now() - new Date(order.created_at).getTime()) / 1000;
      const remaining = ORDER_EXPIRY_MINUTES * 60 - elapsed;
      if (remaining <= 0) { setStep("input"); setOrder(null); setError("La orden expiró. Intenta de nuevo."); clearInterval(iv); return; }
      setTimeLeft(remaining);
    }, 1000);
    return () => clearInterval(iv);
  }, [step, order]);

  // Auto-check payment status
  useEffect(() => {
    if (step !== "payment" || !order) return;
    const check = async () => {
      setChecking(true);
      try {
        const res = await fetch(`/api/orders/check?id=${order.id}`);
        const data = await res.json();
        if (data.status === "completed") { setStep("success"); }
      } catch {}
      setChecking(false);
    };
    check();
    const iv = setInterval(check, 15000); // Check every 15s
    return () => clearInterval(iv);
  }, [step, order]);

  const handleCreateOrder = async () => {
    if (!mxnAmount || parseFloat(mxnAmount) < 10 || !doggyAmount || !userWallet) return;
    setError("");

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mxnAmount: parseFloat(mxnAmount),
          doggyAmount: parseFloat(doggyAmount?.replace(/,/g, "") || "0"),
          usdcAmount,
          usdcMxnRate: usdcMxn,
          userWallet,
          particleUserId: "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando orden");
      setOrder(data);
      setStep("payment");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const formatClabe = (c: string) => c.replace(/(.{4})/g, "$1 ");

  // === SUCCESS SCREEN ===
  if (step === "success") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-white mb-2">¡Pago recibido!</h3>
          <p className="text-gray-400 text-sm mb-1">Tus DOGGY están en tu wallet.</p>
          {order?.solana_tx_signature && (
            <a href={`https://explorer.solana.com/tx/${order.solana_tx_signature}`} target="_blank" className="text-green-400 text-xs underline">
              Ver transacción
            </a>
          )}
          <button onClick={() => { setStep("input"); setMxnAmount(""); setOrder(null); }} className="mt-6 px-6 py-2.5 rounded-xl text-sm font-medium" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}>
            Nueva compra
          </button>
        </div>
      </div>
    );
  }

  // === PAYMENT SCREEN ===
  if (step === "payment" && order) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={() => { setStep("input"); setOrder(null); }} className="text-gray-500 text-sm hover:text-white transition-colors">← Volver</button>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-2xl font-mono font-bold ${timeLeft < 120 ? "text-red-400 animate-pulse" : "text-yellow-400"}`}>{formatTime(timeLeft)}</span>
            <span className="text-gray-500 text-xs">restantes</span>
          </div>

          {/* Transfer info */}
          <div className="rounded-xl p-5 space-y-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-gray-400 text-sm text-center">Transfiere <span className="text-white font-bold text-lg">exactamente</span> por SPEI:</p>

            {/* Amount */}
            <div className="rounded-xl p-4 text-center" style={{ background: "#252538" }}>
              <p className="text-gray-500 text-xs mb-1">Monto exacto</p>
              <p className="text-white text-3xl font-bold">${order.exact_amount?.toFixed(2)}</p>
              <p className="text-gray-500 text-xs">MXN</p>
            </div>

            {/* Copy amount */}
            <button onClick={() => { navigator.clipboard.writeText(order.exact_amount?.toFixed(2) || ""); }}
              className="w-full py-2 rounded-lg text-xs font-medium transition-colors" style={{ background: "rgba(255,215,0,0.1)", color: "#FFD700" }}>
              📋 Copiar monto ($${order.exact_amount?.toFixed(2)})
            </button>

            {/* CLABE */}
            <div>
              <p className="text-gray-500 text-xs mb-2">CLABE interbancaria:</p>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#252538" }}>
                <p className="text-white text-lg font-mono tracking-wider">{formatClabe(CLABE)}</p>
                <button onClick={() => { navigator.clipboard.writeText(CLABE.replace(/\s/g, "")); }} className="text-yellow-400 text-xs">Copiar</button>
              </div>
            </div>

            {/* Beneficiary */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Beneficiario</span>
              <span className="text-white">{BENEFICIARIO}</span>
            </div>
          </div>

          {/* What you receive */}
          <div className="rounded-xl p-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center gap-3">
              <img src={DOGGY_LOGO} alt="" className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-gray-400 text-xs">Recibirás</p>
                <p className="text-white text-xl font-bold">{doggyAmount} DOGGY</p>
              </div>
            </div>
          </div>

          {/* Report payment button */}
          {!checking && order && order.status === "pending" && (
            <button
              onClick={async () => {
                try {
                  setOrder({ ...order, status: "payment_reported" });
                  await fetch("/api/orders/report", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id }),
                  });
                  setChecking(true);
                } catch {}
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "rgba(0,200,83,0.15)", color: "#4CAF50", border: "1px solid rgba(0,200,83,0.2)" }}>
              ✅ Ya realicé mi transferencia SPEI
            </button>
          )}

          {/* Checking / Reported status */}
          {(checking || order.status === "payment_reported") && (
            <p className="text-gray-400 text-xs text-center animate-pulse">⏳ Verificando pago — espera confirmación del administrador...</p>
          )}

          <p className="text-gray-600 text-[10px] text-center">Oprime el botón al transferir. No cierres esta página.</p>
        </div>
      </div>
    );
  }

  // === INPUT SCREEN ===
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl p-5 space-y-4" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.06)" }}>

        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Comprar DOGGY</h2>
          {usdcMxn && <span className="text-gray-500 text-[11px]">USDC: ${usdcMxn.toFixed(2)} MXN</span>}
        </div>

        {/* MXN Input */}
        <div className="rounded-xl p-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium">Pagas con</span>
            <span className="text-gray-500 text-[11px]">Monto mínimo: $10 MXN</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0" style={{ background: "#252538" }}>
              <img src={MXN_LOGO} alt="" className="w-5 h-5 rounded-full" />
              <span className="text-white text-sm font-medium">MXN</span>
              <span className="text-gray-500 text-[10px]">SPEI</span>
            </div>
            <div className="relative flex-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 text-xl">$</span>
              <input type="number" placeholder="0.00" value={mxnAmount} onChange={(e) => { setMxnAmount(e.target.value); setError(""); }}
                className="w-full bg-transparent text-white text-2xl font-light text-right outline-none placeholder-gray-600 pl-6 min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {[100, 500, 1000, 5000].map(amt => (
              <button key={amt} onClick={() => setMxnAmount(amt.toString())}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ background: parseFloat(mxnAmount) === amt ? "rgba(0,158,227,0.15)" : "rgba(255,255,255,0.04)", color: parseFloat(mxnAmount) === amt ? "#009EE3" : "rgba(255,255,255,0.4)" }}>
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Conversion */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
          <span>≈ {usdcAmount || "—"} USDC</span>
          <span>→</span>
          <span>≈ {doggyAmount || "—"} DOGGY</span>
        </div>

        {/* DOGGY Output */}
        <div className="rounded-xl p-4" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-xs font-medium">Recibes</span>
            {doggyPriceUsd && <span className="text-gray-600 text-[11px]">1 DOGGY ≈ ${doggyPriceUsd.toFixed(6)} USDC</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0" style={{ background: "#252538" }}>
              <img src={DOGGY_LOGO} alt="" className="w-5 h-5 rounded-full object-cover" />
              <span className="text-white text-sm font-medium">DOGGY</span>
            </div>
            <div className="flex-1 text-right">
              <p className="text-white text-2xl font-light">
                {!mxnAmount || !doggyAmount ? <span className="text-gray-600">0</span> : doggyAmount}
              </p>
            </div>
          </div>
        </div>

        {/* Price breakdown */}
        {mxnAmount && usdcMxn && doggyPriceUsd && doggyAmount && (
          <div className="px-1 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between"><span>Tasa USDC/MXN</span><span>${usdcMxn.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Precio DOGGY/USDC</span><span>{doggyPriceUsd.toFixed(6)}</span></div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-lg text-xs text-red-400" style={{ background: "rgba(255,50,50,0.06)", border: "1px solid rgba(255,50,50,0.1)" }}>{error}</div>
        )}

        <button onClick={handleCreateOrder}
          disabled={!mxnAmount || parseFloat(mxnAmount) < 10 || !doggyAmount}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-25"
          style={{
            background: mxnAmount && parseFloat(mxnAmount) >= 10 && doggyAmount ? "#009EE3" : "rgba(255,255,255,0.05)",
            color: mxnAmount && parseFloat(mxnAmount) >= 10 && doggyAmount ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: mxnAmount && parseFloat(mxnAmount) >= 10 && doggyAmount ? "0 4px 20px rgba(0,158,227,0.25)" : "none",
          }}>
          {mxnAmount && parseFloat(mxnAmount) >= 10 && doggyAmount ? "Generar orden de pago" : "Ingresa un monto"}
        </button>
      </div>

      <p className="text-center text-gray-600 text-[10px] mt-3">Pago directo por SPEI · Sin comisiones extras</p>
    </div>
  );
}
