"use client";
import { useEffect } from "react";
import { useDisconnect } from "@particle-network/connectkit";

export default function LogoutPage() {
  const { disconnectAsync } = useDisconnect();

  useEffect(() => {
    disconnectAsync().finally(() => {
      window.location.href = "/";
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#050d1f" }}>
      <div className="animate-spin text-2xl">🐾</div>
    </div>
  );
}
