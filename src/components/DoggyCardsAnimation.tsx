"use client";

import { useState } from "react";
import Image from "next/image";

export function DoggyCardsAnimation() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative flex justify-center items-center"
      style={{ transform: "scale(0.6)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* FIAT Card */}
      <div
        className={`
          relative w-[140px] h-[170px] rounded-2xl
          flex flex-col justify-center items-center gap-3
          transition-all duration-500 cursor-pointer
          border backdrop-blur-xl overflow-hidden
        `}
        style={{
          background: "linear-gradient(135deg, rgba(0,180,120,0.2) 0%, rgba(0,100,80,0.1) 100%)",
          borderColor: "rgba(0, 220, 150, 0.3)",
          boxShadow: isHovered ? "0 0 30px rgba(0,220,150,0.4), 0 25px 25px rgba(0,0,0,0.4)" : "0 25px 25px rgba(0, 0, 0, 0.4)",
          transform: isHovered ? "rotate(0deg)" : "rotate(-15deg)",
          marginRight: isHovered ? "10px" : "-35px",
          zIndex: 1,
        }}
      >
        {/* SVG Billetes */}
        <svg width="120" height="100" viewBox="0 0 170 145" style={{ filter: "drop-shadow(0 0 10px rgba(0,220,150,0.5))" }}>
          <g transform="translate(-8,10) scale(1.15)">
            <rect x="4" y="60" width="60" height="35" rx="4" fill="#165c32" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <rect x="2" y="40" width="60" height="35" rx="4" fill="#1a7038" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
            <rect x="0" y="18" width="62" height="36" rx="4" fill="#1e8040" stroke="rgba(255,255,255,0.24)" strokeWidth="1.4"/>
            <ellipse cx="31" cy="36" rx="13" ry="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
            <text x="31" y="41" textAnchor="middle" fontFamily="Georgia,serif" fontSize="14" fontWeight="bold" fill="rgba(255,255,255,0.85)">$</text>
            <rect x="22" y="14" width="18" height="44" rx="2.5" fill="none" stroke="rgba(255,230,100,0.7)" strokeWidth="1.8"/>
          </g>
          <g transform="translate(55,2) scale(1.15)">
            <rect x="2" y="63" width="60" height="35" rx="4" fill="#165c32" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <rect x="0" y="42" width="60" height="35" rx="4" fill="#1a7038" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
            <rect x="0" y="18" width="63" height="38" rx="4" fill="#22a050" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6"/>
            <ellipse cx="31.5" cy="37" rx="14" ry="9.5" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.22)" strokeWidth="1.1"/>
            <text x="31.5" y="42" textAnchor="middle" fontFamily="Georgia,serif" fontSize="15" fontWeight="bold" fill="rgba(255,255,255,0.9)">$</text>
            <rect x="23" y="14" width="19" height="46" rx="2.5" fill="none" stroke="rgba(255,230,100,0.8)" strokeWidth="2"/>
          </g>
          <g transform="translate(112,10) scale(1.15)">
            <rect x="2" y="60" width="60" height="35" rx="4" fill="#165c32" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <rect x="0" y="40" width="60" height="35" rx="4" fill="#1a7038" stroke="rgba(255,255,255,0.14)" strokeWidth="1"/>
            <rect x="0" y="18" width="62" height="36" rx="4" fill="#1e8040" stroke="rgba(255,255,255,0.24)" strokeWidth="1.4"/>
            <ellipse cx="31" cy="36" rx="13" ry="9" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>
            <text x="31" y="41" textAnchor="middle" fontFamily="Georgia,serif" fontSize="14" fontWeight="bold" fill="rgba(255,255,255,0.85)">$</text>
            <rect x="22" y="14" width="18" height="44" rx="2.5" fill="none" stroke="rgba(255,230,100,0.7)" strokeWidth="1.8"/>
          </g>
        </svg>
        {/* Label */}
        <div
          className="absolute bottom-0 w-full h-10 flex justify-center items-center text-white text-xs font-bold tracking-wider"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0 0 16px 16px",
          }}
        >
          FIAT
        </div>
      </div>

      {/* ONRAMP Card */}
      <div
        className={`
          relative w-[140px] h-[170px] rounded-2xl
          flex flex-col justify-center items-center gap-3
          transition-all duration-500 cursor-pointer
          border backdrop-blur-xl overflow-hidden
        `}
        style={{
          background: "linear-gradient(135deg, rgba(255,140,0,0.18) 0%, rgba(200,80,0,0.08) 100%)",
          borderColor: "rgba(255, 160, 50, 0.3)",
          boxShadow: isHovered ? "0 0 30px rgba(255,140,0,0.4), 0 25px 25px rgba(0,0,0,0.4)" : "0 25px 25px rgba(0, 0, 0, 0.4)",
          transform: isHovered ? "rotate(0deg)" : "rotate(5deg)",
          marginLeft: isHovered ? "10px" : "-35px",
          marginRight: isHovered ? "10px" : "-35px",
          zIndex: 2,
        }}
      >
        {/* Arrow Icon */}
        <svg width="50" height="50" viewBox="0 0 448 512" fill="#fff" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.4))" }}>
          <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
        </svg>
        {/* Dots */}
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "0s" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
        {/* Label */}
        <div
          className="absolute bottom-0 w-full h-10 flex justify-center items-center text-white text-xs font-bold tracking-wider"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0 0 16px 16px",
          }}
        >
          ONRAMP
        </div>
      </div>

      {/* DOGGY Card - Con imagen del perrito */}
      <div
        className={`
          relative w-[140px] h-[170px] rounded-2xl
          flex flex-col justify-center items-center gap-3
          transition-all duration-500 cursor-pointer
          border backdrop-blur-xl overflow-hidden
        `}
        style={{
          background: "linear-gradient(135deg, rgba(255,210,0,0.22) 0%, rgba(180,120,0,0.1) 100%)",
          borderColor: "rgba(255, 210, 0, 0.35)",
          boxShadow: isHovered ? "0 0 40px rgba(255,210,0,0.55), 0 25px 25px rgba(0,0,0,0.4)" : "0 25px 25px rgba(0, 0, 0, 0.4)",
          transform: isHovered ? "rotate(0deg)" : "rotate(25deg)",
          marginLeft: isHovered ? "10px" : "-35px",
          zIndex: 1,
        }}
      >
        {/* Doggy Image */}
        <div 
          className="relative w-16 h-16"
          style={{
            animation: isHovered ? "floatPulse 1.8s ease-in-out infinite" : "none",
          }}
        >
          <Image
            src="/doggy.png"
            alt="DOGGY"
            fill
            className="object-contain"
            style={{ filter: "drop-shadow(0 0 10px rgba(255,215,0,0.6))" }}
          />
        </div>
        {/* Badge */}
        <span
          className="px-3 py-1 rounded-md text-xs font-bold tracking-wider"
          style={{
            color: "#ffd700",
            background: "linear-gradient(90deg, rgba(255,210,0,0.1), rgba(255,200,0,0.3), rgba(255,210,0,0.1))",
            backgroundSize: "200% auto",
            animation: "shimmer 2.5s linear infinite",
            border: "1px solid rgba(255,215,0,0.4)",
          }}
        >
          $DOGGY
        </span>
        {/* Label */}
        <div
          className="absolute bottom-0 w-full h-10 flex justify-center items-center text-white text-xs font-bold tracking-wider"
          style={{
            background: "rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "0 0 16px 16px",
          }}
        >
          $DOGGY
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatPulse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.08); }
        }
      `}</style>
    </div>
  );
}