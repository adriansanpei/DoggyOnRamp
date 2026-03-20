"use client";

import { useState, useEffect, type ReactNode } from "react";
import { ConnectKitProvider, createConfig } from "@particle-network/connectkit";
import { wallet, type EntryPosition } from "@particle-network/connectkit/wallet";
import { defineChain, type Chain } from "@particle-network/connectkit/chains";
import { authWalletConnectors } from "@particle-network/connectkit/auth";

const supportChains: Chain[] = [
  defineChain({
    id: 101,
    name: "Solana",
    nativeCurrency: { decimals: 9, name: "Solana", symbol: "SOL" },
    rpcUrls: { default: { http: ["https://api.mainnet-beta.solana.com"] } },
    blockExplorers: { default: { name: "Explorer", url: "https://explorer.solana.com" } },
    testnet: false,
  }),
];

const config = createConfig({
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT_KEY!,
  appId: process.env.NEXT_PUBLIC_APP_ID!,
  appearance: {
    recommendedWallets: [],
    theme: {
      "--pcm-font-family": "'Inter', sans-serif",
      "--pcm-rounded-sm": "4px",
      "--pcm-rounded-md": "8px",
      "--pcm-rounded-lg": "11px",
    },
    splitEmailAndPhone: true,
    collapseWalletList: true,
    hideContinueButton: false,
    connectorsOrder: ["social"],
    collapsePasskeyButton: true,
    language: "en-US",
    overrideLocales: {
      "en-US": {
        signupTitle: "Iniciar sesión o regístrate",
        connectorsTitle: "Iniciar sesión o regístrate",
        continue: "Continuar",
        continueWithWallet: "Continuar con una wallet",
      },
    },
  },
  walletConnectors: [
    authWalletConnectors({
      authTypes: ["google", "email", "apple", "twitter", "discord"],
      fiatCoin: "USD",
      promptSettingConfig: {
        promptMasterPasswordSettingWhenLogin: 0,
        promptPaymentPasswordSettingWhenSign: 1,
      },
    }),
  ],
  plugins: [
    wallet({
      entryPosition: "bottom-right" as EntryPosition,
      visible: true,
      customStyle: { fiatCoin: "USD" },
    }),
  ],
  chains: supportChains as unknown as readonly [Chain, ...Chain[]],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050d1f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return <ConnectKitProvider config={config}>{children}</ConnectKitProvider>;
}
