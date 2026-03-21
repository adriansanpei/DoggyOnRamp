"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("doggy_admin") === "true") setLoggedIn(true);
  }, []);

  const handleLogin = () => {
    if (password === "DOGGY2024admin") {
      localStorage.setItem("doggy_admin", "true");
      setLoggedIn(true);
    } else {
      setError("Contraseña incorrecta");
    }
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1f" }}>
        <div className="rounded-2xl p-8 w-full max-w-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h1 className="text-xl font-bold mb-6 text-center" style={{ color: "#FFD700" }}>DOGGY Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-lg text-sm mb-4 outline-none"
            style={{ background: "rgba(0,0,0,0.3)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
          />
          {error && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{error}</p>}
          <button onClick={handleLogin} className="w-full py-3 rounded-lg text-sm font-bold" style={{ background: "#FFD700", color: "#000" }}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("purchases");
  const [purchases, setPurchases] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, rRes, cRes] = await Promise.all([
        fetch("/api/admin/purchases"),
        fetch("/api/admin/referrals"),
        fetch("/api/admin/claims"),
      ]);
      const pData = await pRes.json();
      const rData = await rRes.json();
      const cData = await cRes.json();
      setPurchases(pData.purchases || []);
      setReferrals(rData.referrals || []);
      setClaims(cData.claims || []);
      const cfgRes = await fetch("/api/admin/config");
      const cfgData = await cfgRes.json();
      setConfig(cfgData.config || {});
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateReferralStatus = async (id: string, status: string, note?: string) => {
    await fetch("/api/admin/referrals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, note }),
    });
    load();
  };

  const tabs = [
    { id: "purchases", label: "Compras" },
    { id: "referrals", label: "Referidos" },
    { id: "claims", label: "Reclamos" },
    { id: "config", label: "Config" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#050d1f" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 className="text-lg font-bold" style={{ color: "#FFD700" }}>DOGGY Admin</h1>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: activeTab === t.id ? "rgba(255,215,0,0.1)" : "transparent", color: activeTab === t.id ? "#FFD700" : "rgba(255,255,255,0.5)", border: activeTab === t.id ? "1px solid rgba(255,215,0,0.3)" : "1px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => load()} className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)" }}>
          Refrescar
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.4)" }}>Cargando...</div>
        ) : activeTab === "purchases" ? (
          <PurchaseTable purchases={purchases} />
        ) : activeTab === "referrals" ? (
          <ReferralTable referrals={referrals} onUpdate={updateReferralStatus} />
        ) : activeTab === "claims" ? (
          <ClaimsTable claims={claims} referrals={referrals} purchases={purchases} onUpdate={updateReferralStatus} />
        ) : activeTab === "config" ? (
          <ConfigTab config={config} onUpdated={() => load()} />
        ) : null}
      </div>
    </div>
  );
}

function PurchaseTable({ purchases }: { purchases: any[] }) {
  const [filterWallet, setFilterWallet] = useState("");
  const [filterMxn, setFilterMxn] = useState("");
  const [filterDoggy, setFilterDoggy] = useState("");

  const filtered = purchases.filter((p: any) => {
    if (filterWallet && !p.user_wallet?.toLowerCase().includes(filterWallet.toLowerCase())) return false;
    if (filterMxn && String(p.mxn_amount) !== filterMxn) return false;
    if (filterDoggy && !String(p.doggy_amount).includes(filterDoggy)) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input placeholder="Wallet..." value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.08)" }} />
        <input placeholder="MXN exacto..." value={filterMxn} onChange={(e) => setFilterMxn(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.08)" }} />
        <input placeholder="DOGGY..." value={filterDoggy} onChange={(e) => setFilterDoggy(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.08)" }} />
        {(filterWallet || filterMxn || filterDoggy) && (
          <button onClick={() => { setFilterWallet(""); setFilterMxn(""); setFilterDoggy(""); }}
            className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}>Limpiar</button>
        )}
        <span className="px-3 py-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{filtered.length} de {purchases.length}</span>
      </div>
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Wallet</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>DOGGY</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>MXN</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>SOL</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>TX</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>Sin compras</td></tr>
          ) : filtered.map((p: any) => (
            <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                {p.user_wallet?.slice(0, 6)}...{p.user_wallet?.slice(-4)}
              </td>
              <td className="px-4 py-3" style={{ color: "#FFD700" }}>{p.doggy_amount || "-"}</td>
              <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.7)" }}>${p.mxn_amount || "-"}</td>
              {p.sol_usd > 0 ? (
                <td className="px-4 py-3" style={{ color: "#9945FF" }}>${p.sol_usd} USD</td>
              ) : (
                <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.25)" }}>SIN SOL</td>
              )}
              <td className="px-4 py-3">
                {p.solana_tx_signature ? (
                  <a href={`https://solscan.io/tx/${p.solana_tx_signature}`} target="_blank" className="font-mono text-xs" style={{ color: "#3b82f6" }}>
                    Ver TX
                  </a>
                ) : "-"}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: p.status === "completed" ? "rgba(34,197,94,0.15)" : p.status === "cancelled" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)", color: p.status === "completed" ? "#22c55e" : p.status === "cancelled" ? "#ef4444" : "#eab308" }}>
                  {p.status === "completed" ? "Completada" : p.status === "cancelled" ? "Cancelada" : p.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {p.created_at ? new Date(p.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function ReferralTable({ referrals, onUpdate }: { referrals: any[]; onUpdate: (id: string, status: string, note?: string) => void }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "rgba(255,255,255,0.03)" }}>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Referidor</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Invitado</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Status</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Nota</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Fecha</th>
            <th className="text-left px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {referrals.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8" style={{ color: "rgba(255,255,255,0.4)" }}>Sin referidos</td></tr>
          ) : referrals.map((r: any) => (
            <tr key={r.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                {r.referrer_wallet?.slice(0, 6)}...{r.referrer_wallet?.slice(-4)}
              </td>
              <td className="px-4 py-3 font-mono text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
                {r.referred_wallet?.slice(0, 6)}...{r.referred_wallet?.slice(-4)}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{
                    background: r.status === "paid" ? "rgba(59,130,246,0.15)" : r.status === "qualified" ? "rgba(34,197,94,0.15)" : r.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                    color: r.status === "paid" ? "#3b82f6" : r.status === "qualified" ? "#22c55e" : r.status === "rejected" ? "#ef4444" : "#eab308"
                  }}>
                  {r.status === "paid" ? "Pagado" : r.status === "qualified" ? "Calificado" : r.status === "rejected" ? "Rechazado" : "Pendiente"}
                </span>
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{r.note || "-"}</td>
              <td className="px-4 py-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {r.created_at ? new Date(r.created_at).toLocaleDateString("es-MX") : "-"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {r.status === "pending" && (
                    <button onClick={() => onUpdate(r.id, "qualified")} className="px-2 py-1 rounded text-xs" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>
                      Calificar
                    </button>
                  )}
                  {r.status === "qualified" && (
                    <button onClick={() => onUpdate(r.id, "paid")} className="px-2 py-1 rounded text-xs" style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                      Marcar Pagado
                    </button>
                  )}
                  {r.status !== "rejected" && r.status !== "paid" && (
                    <button onClick={() => onUpdate(r.id, "rejected")} className="px-2 py-1 rounded text-xs" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                      Rechazar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClaimsTable({ claims, referrals, purchases, onUpdate }: { claims: any[]; referrals: any[]; purchases: any[]; onUpdate: (id: string, status: string) => void }) {
  const pendingClaims = referrals.filter((r: any) => r.status === "qualified");

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
        {pendingClaims.length} reclamo(s) pendiente(s) de recompensa
      </p>
      {pendingClaims.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Sin reclamos pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingClaims.map((r: any) => {
            const refPurchases = purchases.filter((p: any) => p.buyer_wallet === r.referred_wallet && p.status === "completed");
            const totalMxn = refPurchases.reduce((sum: number, p: any) => sum + (parseFloat(p.amount_mxn) || 0), 0);
            return (
              <div key={r.id} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                      Referidor: <span className="font-mono">{r.referrer_wallet?.slice(0, 6)}...{r.referrer_wallet?.slice(-4)}</span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Invitado: <span className="font-mono">{r.referred_wallet?.slice(0, 6)}...{r.referred_wallet?.slice(-4)}</span>
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Calificado</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Compras</div>
                    <div className="text-sm font-bold" style={{ color: "#fff" }}>{refPurchases.length}</div>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total MXN</div>
                    <div className="text-sm font-bold" style={{ color: "#22c55e" }}>${totalMxn.toFixed(2)}</div>
                  </div>
                  <div className="rounded-lg p-2 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Recompensa</div>
                    <div className="text-sm font-bold" style={{ color: "#FFD700" }}>2,000 DOGGY</div>
                  </div>
                </div>
                {refPurchases.length > 0 && (
                  <div className="text-xs mb-3 p-2 rounded" style={{ background: "rgba(0,0,0,0.15)", color: "rgba(255,255,255,0.5)" }}>
                    Compras del invitado: {refPurchases.map((p: any) => `$${p.amount_mxn} MXN`).join(", ")}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => onUpdate(r.id, "paid")} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "#FFD700", color: "#000" }}>
                    Confirmar Pago
                  </button>
                  <button onClick={() => onUpdate(r.id, "rejected")} className="px-4 py-2 rounded-lg text-xs" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                    Rechazar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConfigTab({ config, onUpdated }: { config: Record<string, string>; onUpdated: () => void }) {
  const [saving, setSaving] = useState(false);

  const updateConfig = async (key: string, value: string) => {
    setSaving(true);
    try {
      await fetch("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
      onUpdated();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-w-lg">
      <h3 className="text-base font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>Configuracion</h3>
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <label className="text-xs block mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Monto minimo para calificar referido (MXN)</label>
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(255,255,255,0.3)" }}>$</span>
          <input type="number" defaultValue={config.referral_min_mxn || "300"}
            onBlur={(e) => updateConfig("referral_min_mxn", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none w-24" style={{ background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.08)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>MXN</span>
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <label className="text-xs block mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Recompensa por referido calificado (DOGGY)</label>
        <div className="flex items-center gap-2">
          <input type="number" defaultValue={config.referral_reward_doggy || "2000"}
            onBlur={(e) => updateConfig("referral_reward_doggy", e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none w-32" style={{ background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.08)" }} />
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>DOGGY</span>
        </div>
      </div>
      {saving && <p className="text-xs" style={{ color: "#FFD700" }}>Guardando...</p>}
    </div>
  );
}
