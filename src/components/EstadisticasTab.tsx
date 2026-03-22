"use client";
import { useEffect, useRef, useState, useCallback } from "react";

const CA = "BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump";
const ATH = 0.0048;

function fmtMoney(n: number | undefined | null) {
  if (!n) return "—";
  n = parseFloat(n as unknown as string);
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(2);
}

function fmtPct(v: number | string | undefined | null) {
  if (v == null) return "—";
  const n = parseFloat(v as string);
  return (n >= 0 ? "+" : "") + n.toFixed(2) + "%";
}

export function EstadisticasTab() {
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState<number | null>(null);
  const [priceMxn, setPriceMxn] = useState<number | null>(null);
  const [c24, setC24] = useState<number | null>(null);
  const [c7d, setC7d] = useState<number | null>(null);
  const [mcap, setMcap] = useState<string>("—");
  const [vol, setVol] = useState<string>("—");
  const [athMult, setAthMult] = useState("Calculando…");
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const [mxnRate, setMxnRate] = useState(17.15);
  const [error, setError] = useState("");
  const lastPriceRef = useRef<number | null>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const barsAnimated = useRef(false);

  const fetchPrice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + CA);
      const data = await res.json();
      const pair = data.pairs && data.pairs[0];
      if (!pair) throw new Error("Sin datos");

      const priceUsd = parseFloat(pair.priceUsd);

      // Fetch MXN rate
      let rate = 17.15;
      try {
        const mxRes = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=USDCMXN");
        const mxData = await mxRes.json();
        if (mxData.price) rate = parseFloat(mxData.price);
      } catch {}
      setMxnRate(rate);

      const priceMxnVal = priceUsd * rate;
      const h24 = pair.priceChange?.h24;
      const d7 = pair.priceChange?.d7;
      const mc = pair.marketCap || pair.fdv;
      const v = pair.volume?.h24;

      if (lastPriceRef.current !== null) {
        setFlash(priceUsd >= lastPriceRef.current ? "up" : "down");
        setTimeout(() => setFlash(null), 900);
      }

      setPrice(priceUsd);
      setPriceMxn(priceMxnVal);
      setC24(h24 ?? null);
      setC7d(d7 ?? null);
      setMcap(fmtMoney(mc));
      setVol(fmtMoney(v));
      lastPriceRef.current = priceUsd;

      const mult = ATH / priceUsd;
      setAthMult(mult >= 1000 ? (mult / 1000).toFixed(1) + "x (×" + Math.round(mult / 1000) + "K)" : mult.toFixed(1) + "x hacia el ATH");
    } catch {
      setError("No se pudo conectar con DexScreener. Intenta de nuevo.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPrice(); }, [fetchPrice]);

  // Animate bars on visibility
  useEffect(() => {
    const el = barsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !barsAnimated.current) {
        barsAnimated.current = true;
        el.querySelectorAll<HTMLElement>(".bar-fill-inner").forEach((b) => {
          b.style.width = b.dataset.w + "%";
        });
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const copyCA = () => {
    navigator.clipboard.writeText(CA).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto" style={{ fontFamily: "'Sora', sans-serif" }}>
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        @keyframes priceFlashUp{0%,100%{color:#fff}50%{color:#22c55e}}
        @keyframes priceFlashDown{0%,100%{color:#fff}50%{color:#ef4444}}
        .sk{background:linear-gradient(90deg,#131620 25%,#1a1e2e 50%,#131620 75%);background-size:400px 100%;animation:shimmer 1.4s infinite linear;border-radius:6px;display:inline-block}
        .flash-up{animation:priceFlashUp 0.8s ease}.flash-down{animation:priceFlashDown 0.8s ease}
        .bar-fill-inner{height:100%;border-radius:4px;width:0;transition:width 1.2s cubic-bezier(0.23,1,0.32,1)}
      `}</style>

      {/* HERO */}
      <div className="rounded-2xl p-8 mb-6 text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="rounded-full px-6 py-2.5 text-base font-bold uppercase tracking-wider" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>$DOGGY</span>
        </div>

        <div className="flex justify-center mb-4">
          <img src="/ques-es-doggy.jpg" alt="DOGGY" className="w-56 h-56 rounded-2xl object-cover" style={{ boxShadow: "0 0 30px rgba(245,158,11,0.2)" }} />
        </div>

        <div className={flash ? `text-5xl font-extrabold tracking-tight mb-1 flash-${flash}` : "text-5xl font-extrabold tracking-tight mb-1"}>
          {price !== null ? `$${price.toFixed(8)} USD` : <span className="sk" style={{ width: 260, height: 48 }}>&nbsp;</span>}
        </div>
        <div className="text-base font-semibold mb-5" style={{ color: "#f59e0b" }}>
          {priceMxn !== null ? `$${priceMxn.toFixed(6)} MXN` : <span className="sk" style={{ width: 140, height: 18, borderRadius: 4, display: "inline-block" }}>&nbsp;</span>}
        </div>

        <div className="flex justify-center gap-0 flex-wrap mb-5">
          {[
            { label: "Cambio 24h", val: c24 },
            { label: "Market Cap", val: mcap, raw: true },
            { label: "Vol 24h", val: vol, raw: true },
          ].map((m, i) => (
            <div key={m.label} className="px-5 text-center" style={i > 0 ? { borderLeft: "1px solid rgba(255,255,255,0.07)" } : {}}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>{m.label}</div>
              <div className="text-sm font-semibold" style={{
                color: m.raw ? "#e8e8e8" : m.val == null ? "#6b7280" : parseFloat(m.val as string) >= 0 ? "#22c55e" : "#ef4444",
                minHeight: 22,
              }}>
                {m.val != null ? (m.raw ? m.val : fmtPct(m.val)) : <span className="sk" style={{ width: 64, height: 18, borderRadius: 4, display: "inline-block" }}>&nbsp;</span>}
              </div>
            </div>
          ))}
        </div>

        <button onClick={fetchPrice} disabled={loading} className="rounded-full px-5 py-2 text-xs font-semibold cursor-pointer transition-all" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
          {loading ? "⏳ Cargando..." : "↻ Actualizar precio"}
        </button>
        {error && <p className="text-xs mt-3" style={{ color: "#ef4444" }}>{error}</p>}
      </div>

      {/* SECTION: Sobre DOGGY */}
      <p className="text-[10px] font-bold uppercase tracking-wider pb-3 mb-4" style={{ color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Sobre DOGGY</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Qué es */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(245,158,11,0.15)" }}>🐶</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ffffff" }}>¿Qué es DOGGY?</span>
          </div>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "#ffffff" }}>La primera memecoin mexicana y latina reconocida mundialmente. Corre en Solana, es deflacionaria y está construida por y para la comunidad latina.</p>
          <div className="flex gap-2 flex-wrap">
            {["Memecoin #1 MX", "Solana SPL", "Deflacionaria"].map((t, i) => (
              <span key={t} className="text-[11px] font-semibold rounded-full px-3 py-1" style={{
                background: i === 0 ? "rgba(245,158,11,0.12)" : i === 1 ? "rgba(153,69,255,0.12)" : "rgba(34,197,94,0.1)",
                border: `1px solid ${i === 0 ? "rgba(245,158,11,0.25)" : i === 1 ? "rgba(153,69,255,0.28)" : "rgba(34,197,94,0.22)"}`,
                color: i === 0 ? "#f59e0b" : i === 1 ? "#9945ff" : "#22c55e",
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* ATH */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(245,158,11,0.15)" }}>🏆</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ffffff" }}>All Time High</span>
          </div>
          <div className="text-3xl font-extrabold">$0.0048 USD</div>
          <div className="text-sm font-semibold mt-1" style={{ color: "#f59e0b" }}>$0.085 MXN</div>
          <div className="text-xs mt-1" style={{ color: "#6b7280" }}>Alcanzado el 4 de octubre</div>
          <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
            <div className="text-[11px] mb-1" style={{ color: "#6b7280" }}>Potencial al ATH desde precio actual</div>
            <div className="text-xl font-extrabold" style={{ color: "#22c55e" }}>{athMult}</div>
          </div>
        </div>
      </div>

      {/* SECTION: Tokenomics */}
      <p className="text-[10px] font-bold uppercase tracking-wider pb-3 mb-4" style={{ color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Tokenomics</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Supply */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(34,197,94,0.12)" }}>📉</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ffffff" }}>Supply</span>
          </div>
          {[
            ["Supply inicial", "1,000,000,000", "#e8e8e8"],
            ["Supply actual", "986,900,000", "#e8e8e8"],
            ["DOGGY quemados", "13,100,000", "#f59e0b"],
          ].map(([label, val, color]) => (
            <div key={label} className="flex justify-between items-center py-2.5 px-3 mb-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
              <span className="text-xs" style={{ color: "#6b7280" }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color }}>{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <span className="text-xs" style={{ color: "#6b7280" }}>Tendencia</span>
            <span className="text-[11px] font-bold rounded-full px-3 py-1" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.22)", color: "#22c55e" }}>Deflacionaria ↓</span>
          </div>
        </div>

        {/* Holders */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(245,158,11,0.15)" }}>👥</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Holders</span>
          </div>
          <div className="text-3xl font-extrabold mb-3">1,412 <span className="text-sm font-normal" style={{ color: "#6b7280" }}>holders</span></div>
          <div ref={barsRef}>
            {([
              ["4h", 35, true],
              ["12h", 35, true],
              ["1d", 28, false],
              ["7d", 100, true],
            ] as const).map(([label, w, up]) => (
              <div key={label as string} className="flex items-center gap-2.5 mb-2">
                <span className="text-[11px] w-7 shrink-0" style={{ color: "#6b7280" }}>{label as string}</span>
                <div className="flex-1 h-[5px] rounded" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="bar-fill-inner" data-w={w as number} style={{ background: up ? "#22c55e" : "#ef4444" }} />
                </div>
                <span className="text-[11px] font-bold w-12 text-right" style={{ color: up ? "#22c55e" : "#ef4444" }}>{up ? "+" : "-"}{w === 100 ? "2.14" : "0.07"}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Potencial */}
        <div className="rounded-2xl p-5 sm:col-span-2 lg:col-span-1" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(245,158,11,0.15)" }}>🚀</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>¿Hasta dónde puede llegar?</span>
          </div>
          <p className="text-xs mb-3" style={{ color: "#ffffff" }}>Sin límite definido. Depende de:</p>
          {[
            ["Target conservador", "$0.001 USD"],
            ["Target optimista", "$0.1 USD / $1.8 MXN"],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between items-center py-2.5 px-3.5 mb-2 rounded-xl" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <span className="text-[11px]" style={{ color: "#ffffff" }}>{label}</span>
              <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{val}</span>
            </div>
          ))}
          <div className="flex gap-2 flex-wrap mt-2">
            {["Adopción", "Comunidad", "Demanda", "Menos supply"].map((t) => (
              <span key={t} className="text-[11px] font-semibold rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION: Trading */}
      <p className="text-[10px] font-bold uppercase tracking-wider pb-3 mb-4" style={{ color: "#6b7280", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Trading y Ecosistema</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Dónde tradear */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(153,69,255,0.12)" }}>⚡</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#ffffff" }}>¿Dónde tradear?</span>
          </div>
          {[
            { name: "Jupiter", desc: "Agregador #1 de Solana. Mejor precio.", abbr: "JUP", href: "https://jup.ag/swap/SOL-BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump", img: "https://storage.googleapis.com/momentum-engine.appspot.com/dex-logos/jupiter.png" },
            { name: "Pumpfun", desc: "La plataforma #1 de memecoins en Solana.", abbr: "PF", href: "https://pump.fun/coin/BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump", img: "https://pump.fun/logo.png" },
            { name: "Raydium", desc: "DEX con pools de liquidez en Solana.", abbr: "RAY", href: "https://raydium.io/swap/?inputMint=sol&outputMint=BS7HxRitaY5ipGfbek1nmatWLbaS9yoWRSEQzCb3pump", img: "https://raydium.io/raydium_logo.png" },
          ].map((d) => (
            <a key={d.name} href={d.href} target="_blank" rel="noopener" className="flex items-center gap-3 py-3 px-3.5 mb-2 rounded-xl transition-all cursor-pointer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={d.img} alt={d.name} className="w-8 h-8 rounded-lg object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "#e8e8e8" }}>{d.name}</div>
                <div className="text-[11px]" style={{ color: "#6b7280" }}>{d.desc}</div>
              </div>
              <span style={{ color: "#f59e0b", fontSize: 14, fontWeight: 700 }}>↗</span>
            </a>
          ))}
        </div>

        {/* CA */}
        <div className="rounded-2xl p-5" style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base" style={{ background: "rgba(59,130,246,0.12)" }}>📋</div>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Contract Address</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>CA — Solana (SPL Token)</div>
          <div className="flex items-center gap-2 py-2.5 px-3 mb-3 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span className="text-[11px] flex-1 truncate font-mono" style={{ color: "#ffffff" }}>{CA}</span>
            <button onClick={copyCA} className="shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer transition-all" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <a href={`https://dexscreener.com/solana/${CA}`} target="_blank" rel="noopener" className="block text-center text-xs font-bold rounded-xl py-2.5 transition-all" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>
            Ver en DexScreener →
          </a>
        </div>
      </div>

      <p className="text-center text-[11px] pb-4" style={{ color: "#6b7280" }}>Datos de precio en tiempo real via DexScreener · $DOGGY es una memecoin, no consejo financiero</p>
    </div>
  );
}
