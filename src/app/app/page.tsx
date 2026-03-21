"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useDisconnect, useParticleAuth, useWallets } from "@particle-network/connectkit";
import { createClient } from "@supabase/supabase-js";
import dynamic from "next/dynamic";

const WalletTab = dynamic(() => import("@/components/WalletTab").then((m) => ({ default: m.WalletTab })), { ssr: false });
const SwapTab = dynamic(() => import("@/components/SwapTab").then((m) => ({ default: m.SwapTab })), { ssr: false });
const ComprasTab = dynamic(() => import("@/components/ComprasTab").then((m) => ({ default: m.ComprasTab })), { ssr: false });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tabs = [
  { id: "estadisticas", label: "📊 Estadísticas" },
  { id: "compras", label: "🛒 Compras" },
  { id: "vender", label: "💸 Vender" },
  { id: "wallet", label: "👛 Wallet" },
  { id: "staking", label: "🥩 Staking" },
  { id: "referidos", label: "👥 Referidos" },
];

export default function AppPage() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("doggy_tab") || "wallet");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usernameModal, setUsernameModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { localStorage.setItem("doggy_tab", activeTab); }, [activeTab]);
  const [username, setUsername] = useState("");
  const [walletReady, setWalletReady] = useState(false);
  const [sidebarName, setSidebarName] = useState("Usuario");
  const { isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { getUserInfo } = useParticleAuth();
  const [primaryWallet] = useWallets();

  // Wait for Particle wallet to be truly initialized
  useEffect(() => {
    if (!isConnected) return;
    const check = () => {
      try {
        if (primaryWallet && typeof primaryWallet.getWalletClient === "function") {
          setWalletReady(true);
          return true;
        }
      } catch {}
      return false;
    };
    if (check()) return;
    const iv = setInterval(() => { if (check()) clearInterval(iv); }, 200);
    return () => clearInterval(iv);
  }, [isConnected, primaryWallet]);

  const router = useRouter();

  // Suppress Particle's internal "wallet not initialized" error on refresh
  useEffect(() => {
    const origError = console.error;
    console.error = (...args: any[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (msg.includes("not a particle wallet") || msg.includes("not initialized")) return;
      origError.apply(console, args);
    };
    return () => { console.error = origError; };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    // Check if user has a name in Supabase
    const checkUser = async () => {
      const userInfo = getUserInfo();
      const solWallet = userInfo.wallets?.find((w: any) => w.chain_name.toLowerCase().includes("solana"));
      const walletAddress = solWallet?.public_address || "";

      const { data: existingUser } = await supabase
        .from("doggy_users")
        .select("id, name")
        .eq("particle_user_id", userInfo.uuid)
        .single();

      if (!existingUser) {
        // First time: create user
        if (userInfo.name) {
          // Social login with name
          await supabase.from("doggy_users").insert({
            particle_user_id: userInfo.uuid,
            email: userInfo.email || userInfo.google_email || userInfo.twitter_email || userInfo.discord_email || userInfo.facebook_email || null,
            name: userInfo.name,
            avatar_url: userInfo.avatar || null,
            wallet_address: walletAddress,
          });
        } else {
          // Email/phone login without name
          await supabase.from("doggy_users").insert({
            particle_user_id: userInfo.uuid,
            email: userInfo.email || userInfo.phone || null,
            name: "",
            avatar_url: userInfo.avatar || null,
            wallet_address: walletAddress,
          });
          setUsernameModal(true);
        }
      } else if (!existingUser.name) {
        setUsernameModal(true);
      }
    };

    checkUser();
  }, [isConnected]);

  // Update sidebar name when Particle is ready
  useEffect(() => {
    if (!isConnected) return;
    let attempts = 0;
    const tryGetName = () => {
      attempts++;
      try {
        const info = getUserInfo();
        if (info?.name) { setSidebarName(info.name); return; }
      } catch {}
      if (attempts < 5) setTimeout(tryGetName, 500);
    };
    tryGetName();
  }, [isConnected]);

  let userInfo: any = null;
  try { userInfo = isConnected ? getUserInfo() : null; } catch {}
  const userName = userInfo?.name || sidebarName;
  const solWallet = userInfo?.wallets?.find((w: any) => w.chain_name.toLowerCase().includes("solana"));
  const solAddress = solWallet?.public_address || "";
  const truncated = solAddress ? `${solAddress.slice(0, 4)}...${solAddress.slice(-4)}` : "";

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    const userInfo = getUserInfo();
    await supabase.from("doggy_users").update({ name: username.trim() }).eq("particle_user_id", userInfo.uuid);
    setSidebarName(username.trim());
    setUsernameModal(false);
  };

  const handleLogout = async () => {
    window.location.href = "/";
  };

  if (loggingOut) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1f" }}><div className="animate-spin text-2xl">🐾</div></div>;
  }

  return (
    <>
      {usernameModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1530] border border-white/10 rounded-2xl p-8 mx-4 w-full max-w-md" style={{ boxShadow: "0 0 40px rgba(0,229,255,0.1)" }}>
            <h2 className="text-white text-xl font-bold mb-2">Elige tu nombre de usuario</h2>
            <p className="text-gray-400 text-sm mb-6">Este nombre será visible en tu perfil de DOGGY</p>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400/50 mb-4"
              autoFocus
            />
            <button
              onClick={handleSaveUsername}
              disabled={!username.trim()}
              className="w-full py-3 rounded-lg font-semibold text-black disabled:opacity-40"
              style={{ background: username.trim() ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" : "rgba(255,255,255,0.1)" }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#050d1f] text-white flex flex-col md:flex-row relative">

        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4" style={{ background: "rgba(5, 13, 31, 0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xl font-bold tracking-wide" style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$DOGGY</span>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4L14 14M14 4L4 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 5H15M3 9H15M3 13H15" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            )}
          </button>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 p-4 md:p-6 flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:w-64 md:min-h-screen`}
          style={{ background: "rgba(5, 13, 31, 0.95)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="mb-8 hidden md:block">
            <span className="text-2xl font-bold tracking-wide" style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$DOGGY</span>
          </div>

          <div className="mb-6 px-3 py-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)", color: "#000" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-gray-500 text-xs truncate font-mono">{truncated}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200" style={{ background: activeTab === tab.id ? "rgba(255,215,0,0.08)" : "transparent", color: activeTab === tab.id ? "#FFD700" : "rgba(255,255,255,0.5)", borderLeft: activeTab === tab.id ? "2px solid #FFD700" : "2px solid transparent" }}>
                {tab.label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors mt-4">
            Cerrar sesión
          </button>
        </aside>

        {/* Main content */}
      {!walletReady ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Cargando wallet...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 p-4 md:p-10 flex items-start md:items-center justify-center overflow-auto">
          {activeTab === "wallet" ? (
            <WalletTab />
          ) : activeTab === "vender" ? (
            <SwapTab />
          ) : activeTab === "compras" ? (
            <ComprasTab onGoToWallet={() => setActiveTab("wallet")} />
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold mb-2" style={{ background: "linear-gradient(90deg, #FFD700, #FFA500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {tabs.find((t) => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-500 text-lg">En construcción</p>
              <p className="text-gray-600 text-sm mt-2">Próximamente disponible</p>
            </div>
          )}
        </main>
      )}
      </div>
    </>
  );
}
