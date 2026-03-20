import React from "react";

type GlowVariant = "cyan" | "blue" | "green" | "purple";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: GlowVariant;
  padding?: string;
}

const glowStyles: Record<GlowVariant, { border: string; shadow: string; bg: string }> = {
  cyan: {
    border: "rgba(0, 212, 255, 0.25)",
    shadow: "0 0 24px rgba(0, 212, 255, 0.12), inset 0 0 32px rgba(0, 212, 255, 0.04)",
    bg: "rgba(8, 22, 55, 0.75)",
  },
  blue: {
    border: "rgba(0, 100, 255, 0.25)",
    shadow: "0 0 24px rgba(0, 100, 255, 0.12), inset 0 0 32px rgba(0, 100, 255, 0.04)",
    bg: "rgba(5, 15, 45, 0.75)",
  },
  green: {
    border: "rgba(0, 255, 128, 0.2)",
    shadow: "0 0 24px rgba(0, 255, 128, 0.1), inset 0 0 32px rgba(0, 255, 128, 0.03)",
    bg: "rgba(5, 20, 35, 0.75)",
  },
  purple: {
    border: "rgba(160, 80, 255, 0.25)",
    shadow: "0 0 24px rgba(160, 80, 255, 0.12), inset 0 0 32px rgba(160, 80, 255, 0.04)",
    bg: "rgba(15, 8, 40, 0.75)",
  },
};

export function GlowCard({ children, className = "", variant = "cyan", padding = "p-6" }: GlowCardProps) {
  const s = glowStyles[variant];
  return (
    <div
      className={`rounded-2xl ${padding} ${className}`}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: s.shadow,
        backdropFilter: "blur(12px)",
      }}
    >
      {children}
    </div>
  );
}