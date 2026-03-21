"use client";

import { useState, useEffect } from "react";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

export function ReferidosTab() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string>("");
  const [refLink, setRefLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, qualified: 0, paid: 0, doggyEarned: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user came from a referral link
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      localStorage.setItem("doggy_ref", ref);
      // Clean URL
      window.history.replaceState({}, "", "/app");
    }

    // Get wallet from localStorage (set by Particle auth)
    const storedWallet = localStorage.getItem("doggy_wallet");
    if (storedWallet) {
      setWallet(storedWallet);
      loadReferralData(storedWallet);
    }
    // Wallet is set by Particle auth in other tabs - listen for storage changes
    const interval = setInterval(() => {
      const w = localStorage.getItem("doggy_wallet");
      if (w && !wallet) {
        setWallet(w);
        loadReferralData(w);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadReferralData = async (addr: string) => {
    setLoading(true);
    try {
      // Get or create referral code
      const codeRes = await fetch("/api/referrals/code?wallet=" + addr);
      const codeData = await codeRes.json();
      if (codeData.code) {
        setRefCode(codeData.code);
        setRefLink(`${BASE_URL}?ref=${codeData.code}`);
      }

      // Get referrals
      const refRes = await fetch("/api/referrals/list?wallet=" + addr);
      const refData = await refRes.json();
      setReferrals(refData.referrals || []);

      // Stats
      const allRef = refData.referrals || [];
      setStats({
        total: allRef.length,
        qualified: allRef.filter((r: any) => r.status === "qualified" || r.status === "paid").length,
        paid: allRef.filter((r: any) => r.status === "paid").length,
        doggyEarned: allRef.filter((r: any) => r.status === "paid").length * 2000,
      });

      // Register referral if came from a link
      const storedRef = localStorage.getItem("doggy_ref");
      if (storedRef && storedRef !== codeData.code) {
        await fetch("/api/referrals/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referrer_code: storedRef, referred_wallet: addr }),
        });
        localStorage.removeItem("doggy_ref");
      }
    } catch (e) {
      console.error("Error loading referral data:", e);
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusBadge = (status: string) => {
    const colors: any = {
      pending: { bg: "rgba(234,179,8,0.15)", text: "#eab308", label: "⏳ Pendiente" },
      qualified: { bg: "rgba(34,197,94,0.15)", text: "#22c55e", label: "✅ Calificado" },
      paid: { bg: "rgba(59,130,246,0.15)", text: "#3b82f6", label: "💸 Pagado" },
      rejected: { bg: "rgba(239,68,68,0.15)", text: "#ef4444", label: "❌ Rechazado" },
    };
    const s = colors[status] || colors.pending;
    return <span style={{ background: s.bg, color: s.text }} className="text-xs px-2 py-1 rounded-full font-medium">{s.label}</span>;
  };

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center py-20" style={{ color: "rgba(255,255,255,0.5)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
        <p>Conecta tu wallet para ver tus referidos</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2">
      {/* Hero Banner */}
      <div className="rounded-2xl p-6 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 30% 50%, #FFD700, transparent 60%)" }} />
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎁</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: "#FFD700" }}>¡Gana DOGGY por invitar!</h2>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
          DOGGY te premia con más DOGGY si lo compartes con tus amigos y familia.
        </p>
        <p className="text-sm font-medium mb-6" style={{ color: "#fff" }}>
          Usa tu link de referido y por cada invitado que compre por lo menos <span style={{ color: "#FFD700" }}>$300 MXN</span> de DOGGY, te llevas <span style={{ color: "#FFD700" }}>2,000 $DOGGY</span> que se depositan directo a tu cartera.
        </p>

        {/* Ref Link */}
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <div className="flex-1 px-4 py-3 rounded-lg text-sm truncate" style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.8)" }}>
            {refLink || "Cargando..."}
          </div>
          <button onClick={copyLink} className="px-4 py-3 rounded-lg text-sm font-bold transition-all" style={{ background: copied ? "#22c55e" : "#FFD700", color: "#000" }}>
            {copied ? "✅ Copiado" : "📋 Copiar"}
          </button>
        </div>
        {refCode && (
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            Código: <span style={{ color: "#FFD700", fontFamily: "monospace" }}>{refCode}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Invitados", value: stats.total, icon: "👥", color: "#a78bfa" },
          { label: "Calificados", value: stats.qualified, icon: "✅", color: "#22c55e" },
          { label: "Pagados", value: stats.paid, icon: "💸", color: "#3b82f6" },
          { label: "DOGGY Ganado", value: stats.doggyEarned.toLocaleString(), icon: "🐾", color: "#FFD700" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referrals List */}
      <div>
        <h3 className="text-base font-semibold mb-3" style={{ color: "rgba(255,255,255,0.9)" }}>
          Mis Invitados
        </h3>
        {loading ? (
          <div className="text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>
            <div className="animate-pulse">Cargando...</div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Aún no tienes invitados. ¡Comparte tu link y gana DOGGY!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,215,0,0.1)" }}>👤</div>
                  <div>
                    <div className="text-sm font-mono" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {r.referred_wallet?.slice(0, 4)}...{r.referred_wallet?.slice(-4)}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("es-MX") : ""}
                    </div>
                  </div>
                </div>
                {statusBadge(r.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
