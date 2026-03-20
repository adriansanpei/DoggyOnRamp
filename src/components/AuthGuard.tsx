"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@particle-network/connectkit";
import { useParticleAuth } from "@particle-network/connectkit";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const { getUserInfo } = useParticleAuth();
  const router = useRouter();
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      return;
    }

    // Wait a moment for user info to be available
    const timer = setTimeout(async () => {
      try {
        const userInfo = getUserInfo();
        const walletAddress = userInfo.wallets?.[0]?.public_address || "";

        // Check if user already exists in Supabase
        const { data: existingUser } = await supabase
          .from("doggy_users")
          .select("id, name")
          .eq("particle_user_id", userInfo.uuid)
          .single();

        if (existingUser?.name) {
          // User already has a name, redirect to /app
          router.push("/app");
        } else if (userInfo.name) {
          // Social login with name available, save and redirect
          await supabase.from("doggy_users").upsert({
            particle_user_id: userInfo.uuid,
            email: userInfo.email || userInfo.google_email || userInfo.twitter_email || userInfo.discord_email || userInfo.facebook_email || null,
            name: userInfo.name,
            avatar_url: userInfo.avatar || null,
            wallet_address: walletAddress,
          }, { onConflict: "particle_user_id" });
          router.push("/app");
        } else {
          // Email or phone login without name, show username modal
          if (!existingUser) {
            await supabase.from("doggy_users").insert({
              particle_user_id: userInfo.uuid,
              email: userInfo.email || userInfo.phone || null,
              name: "",
              avatar_url: userInfo.avatar || null,
              wallet_address: walletAddress,
            });
          }
          setShowUsernameModal(true);
        }
      } catch (err) {
        console.error("AuthGuard error:", err);
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isConnected, getUserInfo, router]);

  const handleSaveUsername = async () => {
    if (!username.trim()) return;
    try {
      const userInfo = getUserInfo();
      await supabase
        .from("doggy_users")
        .update({ name: username.trim() })
        .eq("particle_user_id", userInfo.uuid);
      setShowUsernameModal(false);
      router.push("/app");
    } catch (err) {
      console.error("Error saving username:", err);
    }
  };

  if (loading) return null;

  return (
    <>
      {showUsernameModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="bg-[#0d1530] border border-white/10 rounded-2xl p-8 mx-4 w-full max-w-md"
            style={{ boxShadow: "0 0 40px rgba(0,229,255,0.1)" }}
          >
            <h2 className="text-white text-xl font-bold mb-2">
              Elige tu nombre de usuario
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Este nombre será visible en tu perfil de DOGGY
            </p>
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
              style={{
                background: username.trim()
                  ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              Continuar
            </button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
