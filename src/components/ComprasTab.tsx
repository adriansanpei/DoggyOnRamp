"use client";

import { useState, useEffect, useCallback } from "react";
import { useParticleAuth } from "@particle-network/connectkit";

const DOGGY_MINT = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
const DOGGY_LOGO = "/images/doggy-logo.jpg";
const MXN_LOGO = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="#006847"/><text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">$</text></svg>');

const CLABE = process.env.NEXT_PUBLIC_CLABE || "";
const BENEFICIARIO = process.env.NEXT_PUBLIC_BENEFICIARIO || "DOGGY";
const ORDER_EXPIRY_MINUTES = 10;

export function ComprasTab({ onGoToWallet }: { onGoToWallet?: () => void }) {
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
  const [solOption, setSolOption] = useState<"none" | "0.50" | "3">("none");
  const [checking, setChecking] = useState(false);

  // History state
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load wallet from localStorage, then Particle
  useEffect(() => {
    const saved = localStorage.getItem("doggy_wallet");
    if (saved) setUserWallet(saved);
    try {
      const userInfo = getUserInfo();
      const solWallet = userInfo?.wallets?.find((w: any) => w.chain_name.toLowerCase().includes("solana"));
      if (solWallet) {
        const addr = solWallet.public_address || "";
        setUserWallet(addr);
        localStorage.setItem("doggy_wallet", addr);
      }
    } catch {}
  }, [getUserInfo]);

  // Fetch order history
  const fetchHistory = useCallback(async () => {
    if (!userWallet) return;
    try {
      const res = await fetch(`/api/orders/history?wallet=${userWallet}`);
      const data = await res.json();
      if (data.orders) setHistory(data.orders);
    } catch {}
  }, [userWallet]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

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
    if (!mxnAmount || parseFloat(mxnAmount) < 10 || !userWallet) return;
    setError("");

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mxnAmount: parseFloat(mxnAmount),
          userWallet,
          solOption: solOption !== "none" ? parseFloat(solOption) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando orden");
      setOrder(data);
      setStep("payment");
      fetchHistory();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const formatClabe = (c: string) => c.replace(/(.{4})/g, "$1 ");

  // === CONFETTI ===
  const [showConfetti, setShowConfetti] = useState(false);
  const [countValue, setCountValue] = useState(0);

  useEffect(() => {
    if (step !== "success" || !order) return;
    setShowConfetti(true);
    const target = Math.floor(Number(order.doggy_amount));

    // Count-up
    const duration = 1400;
    const startDelay = 1100;
    const t0 = performance.now() + startDelay;
    function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
    function tick() {
      const elapsed = performance.now() - t0;
      if (elapsed < 0) { requestAnimationFrame(tick); return; }
      const progress = Math.min(elapsed / duration, 1);
      setCountValue(Math.floor(easeOut(progress) * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Confetti
    setTimeout(() => {
      const cvs = document.getElementById("doggy-confetti") as HTMLCanvasElement;
      const ctx = cvs.getContext("2d")!;
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      const colors = ["#f59e0b", "#fbbf24", "#ffffff", "#fde68a", "#d97706"];
      const particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * cvs.width,
        y: -20 - Math.random() * 200,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.5 ? "circle" : "rect",
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 3,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 6,
        opacity: 0.8 + Math.random() * 0.2,
      }));
      let active = true;
      function draw() {
        if (!active || !ctx) return;
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        let allDead = true;
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed; p.vy += 0.04;
          if (p.y < cvs.height + 20) allDead = false;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * Math.PI / 180);
          ctx.globalAlpha = p.opacity * Math.min(1, (cvs.height - p.y + 60) / 100);
          ctx.fillStyle = p.color;
          if (p.shape === "circle") { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
          else { ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
          ctx.restore();
        }
        if (allDead) { active = false; ctx.clearRect(0, 0, cvs.width, cvs.height); return; }
        requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
      setTimeout(() => setShowConfetti(false), 4000);
    }, 300);
  }, [step, order]);

  // === SUCCESS SCREEN ===
  if (step === "success") {
    const doggyNum = Math.floor(Number(order?.doggy_amount || 0));
    return (
      <>
        {/* Confetti Canvas */}
        {showConfetti && <canvas id="doggy-confetti" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99 }} />}

        <div className="w-full max-w-md mx-auto relative" style={{ zIndex: 101 }}>
          <div className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{
              background: "#131620",
              border: "1px solid rgba(245,158,11,0.18)",
              boxShadow: "0 0 0 1px rgba(245,158,11,0.08), 0 24px 60px rgba(0,0,0,0.6), 0 0 80px rgba(245,158,11,0.06)",
            }}>

            {/* Paw icon */}
            <div style={{ fontSize: 64, marginBottom: 20, animation: "pawFloat 3s ease-in-out 1.2s infinite", filter: "drop-shadow(0 0 18px rgba(240,192,48,0.6)) drop-shadow(0 0 40px rgba(240,192,48,0.3))" }}>
              🐾
            </div>

            {/* Headline */}
            <h3 style={{
              fontSize: 22, fontWeight: 800, color: "#f0c030", marginBottom: 10,
              textShadow: "0 0 12px rgba(245,158,11,0.5), 0 0 32px rgba(245,158,11,0.2)",
              fontFamily: "'Sora', sans-serif",
            }}>
              ¡Compra Exitosa!
            </h3>

            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 6 }}>
              Pronto verás los DOGGYs reflejados<br />en tu panel de Wallet
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 24 }}>
              {order?.solana_tx_signature ? "Tus DOGGYs ya están en camino 🚀" : "Estamos enviando tus DOGGYs… aguanta tantito"}
            </p>

            {/* Divider */}
            <div style={{ width: 40, height: 2, background: "rgba(245,158,11,0.25)", borderRadius: 2, margin: "0 auto 20px" }} />

            {/* Amount with count-up */}
            <div style={{ marginBottom: 28 }}>
              <span style={{
                fontSize: 36, fontWeight: 800, color: "#f0c030", letterSpacing: -0.5,
                textShadow: "0 0 12px rgba(245,158,11,0.5), 0 0 32px rgba(245,158,11,0.2)",
                fontFamily: "'Sora', sans-serif",
              }}>
                +{countValue.toLocaleString("es-MX")} DOGGY
              </span>
            </div>

            {/* TX link */}
            {order?.solana_tx_signature && (
              <a href={`https://explorer.solana.com/tx/${order.solana_tx_signature}`} target="_blank"
                className="block text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "underline" }}>
                Ver transacción en Solana Explorer
              </a>
            )}

            {/* CTA Button */}
            <button onClick={() => { onGoToWallet?.(); setMxnAmount(""); setOrder(null); }}
              style={{
                display: "block", width: "100%", padding: "14px 0",
                background: "#f59e0b", color: "#080a10",
                fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
                border: "none", borderRadius: 14, cursor: "pointer",
                marginBottom: 14, transition: "all 0.2s",
              }}
              onMouseOver={(e) => { (e.target as HTMLElement).style.background = "#fbbf24"; (e.target as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseOut={(e) => { (e.target as HTMLElement).style.background = "#f59e0b"; (e.target as HTMLElement).style.transform = "translateY(0)"; }}>
              Ver mi Wallet →
            </button>

            <button onClick={() => { setStep("input"); setMxnAmount(""); setOrder(null); }}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                fontSize: 13, cursor: "pointer", padding: "4px 12px",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
              onMouseOut={(e) => { (e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)"; }}>
              Cerrar
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pawFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
        `}</style>
      </>
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
                <p className="text-white text-xl font-bold">{Number(order.doggy_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} DOGGY</p>
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

          {/* Cancel order button */}
          <button
            onClick={() => { setStep("input"); setOrder(null); setMxnAmount(""); }}
            className="w-full py-2.5 rounded-xl font-medium text-sm transition-all"
            style={{ background: "rgba(255,50,50,0.06)", color: "#ef4444", border: "1px solid rgba(255,50,50,0.1)" }}>
            Cancelar orden
          </button>
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
              <input type="number" placeholder="0.00" value={mxnAmount} onChange={(e) => { setMxnAmount(e.target.value); setError(""); setSolOption("none"); }}
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

        {/* SOL for gas option */}
        {mxnAmount && parseFloat(mxnAmount) >= 10 && usdcMxn && (
          <div className="rounded-xl p-3" style={{ background: "#1a1b2e", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-medium">SOL para comisiones (gas)</span>
            </div>
            <p className="text-gray-500 text-[11px] mb-2">Es necesario contar con SOL para hacer transacciones en Solana.</p>
            <div className="flex gap-2">
              {([
                { value: "none", label: "Sin SOL", desc: `${mxnAmount} MXN 100% en DOGGY` },
                { value: "0.50", label: "$0.50 USD", desc: `$${(parseFloat(mxnAmount) - 0.50 * usdcMxn).toFixed(0)} DOGGY + $${(0.50 * usdcMxn).toFixed(0)} SOL` },
                { value: "3", label: "$3 USD", desc: `$${(parseFloat(mxnAmount) - 3 * usdcMxn).toFixed(0)} DOGGY + $${(3 * usdcMxn).toFixed(0)} SOL` },
              ] as const).map((opt) => {
                const disabled = opt.value !== "none" && (parseFloat(mxnAmount) - parseFloat(opt.value) * usdcMxn < 10);
                return (
                  <button key={opt.value} disabled={disabled}
                    onClick={() => setSolOption(opt.value)}
                    className="flex-1 py-2 rounded-lg text-xs transition-all"
                    style={{
                      background: solOption === opt.value ? "rgba(255,215,0,0.1)" : "rgba(255,255,255,0.03)",
                      border: solOption === opt.value ? "1px solid rgba(255,215,0,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      color: disabled ? "rgba(255,255,255,0.2)" : solOption === opt.value ? "#FFD700" : "rgba(255,255,255,0.5)",
                    }}>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] mt-0.5 opacity-60">{disabled ? "Monto insuficiente" : opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversion */}
        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
          <span>≈ {(() => {
            if (!usdcMxn || !mxnAmount) return "—";
            const mxnForDoggy = solOption !== "none" ? parseFloat(mxnAmount) - parseFloat(solOption) * usdcMxn : parseFloat(mxnAmount);
            return (mxnForDoggy / usdcMxn).toFixed(2);
          })()} USDC</span>
          <span>→</span>
          <span>≈ {(() => {
            if (!usdcMxn || !mxnAmount || !doggyPriceUsd) return "—";
            const mxnForDoggy = solOption !== "none" ? parseFloat(mxnAmount) - parseFloat(solOption) * usdcMxn : parseFloat(mxnAmount);
            const usdc = mxnForDoggy / usdcMxn;
            const doggy = usdc / doggyPriceUsd;
            return doggy > 1000000 ? (doggy / 1000000).toFixed(1) + "M" : doggy > 1000 ? Math.floor(doggy).toLocaleString() : doggy.toFixed(2);
          })()} DOGGY{solOption !== "none" ? ` + ${solOption} USD en SOL` : ""}</span>
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
                {!mxnAmount || !doggyAmount ? <span className="text-gray-600">0</span> :
                  solOption !== "none" && usdcMxn && doggyPriceUsd
                    ? (() => { const m = parseFloat(mxnAmount) - parseFloat(solOption) * usdcMxn; return (m / usdcMxn / doggyPriceUsd).toFixed(2); })()
                    : doggyAmount}
              </p>
            </div>
          </div>
          {solOption !== "none" && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0" style={{ background: "#252538" }}>
                <span className="text-sm"><img src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png" alt="" className="w-5 h-5 rounded-full inline-block -mt-0.5" /></span>
                <span className="text-white text-sm font-medium">SOL</span>
              </div>
              <div className="flex-1 text-right">
                <p className="text-2xl font-light" style={{ color: "#9945FF" }}>
                  ${solOption} USD
                </p>
              </div>
            </div>
          )}
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
          disabled={!mxnAmount || parseFloat(mxnAmount) < 10}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-25"
          style={{
            background: mxnAmount && parseFloat(mxnAmount) >= 10 ? "#009EE3" : "rgba(255,255,255,0.05)",
            color: mxnAmount && parseFloat(mxnAmount) >= 10 ? "white" : "rgba(255,255,255,0.3)",
            boxShadow: mxnAmount && parseFloat(mxnAmount) >= 10 ? "0 4px 20px rgba(0,158,227,0.25)" : "none",
          }}>
          {mxnAmount && parseFloat(mxnAmount) >= 10 ? "Generar orden de pago" : "Ingresa un monto"}
        </button>
      </div>

      <p className="text-center text-gray-600 text-[10px] mt-3">Pago directo por SPEI · Sin comisiones extras</p>

      {/* History toggle */}
      {history.length > 0 && (
        <div className="mt-4 max-w-md mx-auto">
          <button onClick={() => setShowHistory(!showHistory)} className="w-full text-center text-gray-500 text-xs py-2 hover:text-gray-300 transition-colors">
            {showHistory ? "▾ Ocultar historial" : `▸ Ver historial (${history.length} órdenes)`}
          </button>
          {showHistory && (
            <div className="space-y-2 mt-2">
              {history.map((o: any) => (
                <div key={o.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "#13141f", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        o.status === "completed" ? "bg-green-500/10 text-green-400" :
                        o.status === "cancelled" ? "bg-red-500/10 text-red-400" :
                        o.status === "payment_reported" ? "bg-yellow-500/10 text-yellow-400" :
                        (Date.now() - new Date(o.created_at).getTime() > 10 * 60 * 1000) ? "bg-red-500/10 text-red-400" :
                        "bg-gray-500/10 text-gray-400"
                      }`}>
                        {o.status === "completed" ? "✅ Completada" : o.status === "cancelled" ? "❌ Cancelada" : o.status === "payment_reported" ? "⏳ Verificando" : (Date.now() - new Date(o.created_at).getTime() > 10 * 60 * 1000) ? "⏰ Expirada" : "⏳ Pendiente"}
                      </span>
                      <span className="text-gray-600 text-[10px]">#{o.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-white text-xs mt-1">${o.mxn_amount} MXN → {Number(o.doggy_amount).toLocaleString()} DOGGY</p>
                    <p className="text-gray-600 text-[10px]">{new Date(o.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  {o.status === "completed" && o.solana_tx_signature && (
                    <a href={`https://explorer.solana.com/tx/${o.solana_tx_signature}`} target="_blank" className="text-blue-400 text-[10px] ml-2 shrink-0">TX ↗</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
