"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Floating currency card component
function FloatingCard({ 
  symbol, 
  label, 
  color, 
  gradient,
  coinGradient,
  position,
  zOffset,
  animationDelay 
}: {
  symbol: string;
  label: string;
  color: string;
  gradient: string;
  coinGradient: string;
  position: { left?: string; right?: string; top: string };
  zOffset: number;
  animationDelay: string;
}) {
  return (
    <div
      className="absolute w-[88px] h-[80px] md:w-[110px] md:h-[100px] rounded-[18px] flex flex-col items-center justify-center gap-1 backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:brightness-125 cursor-pointer"
      style={{
        ...position,
        background: "rgba(10, 20, 40, 0.55)",
        border: `1.5px solid ${color}66`,
        boxShadow: `0 0 22px ${color}66, 0 0 50px ${color}33, inset 0 0 15px ${color}11`,
        color: color,
        transform: `rotateX(14deg) rotateY(-22deg) rotateZ(2deg) translateZ(${zOffset}px)`,
        animation: `float${label} ${animationDelay} ease-in-out infinite`,
      }}
    >
      <div
        className="w-[34px] h-[34px] md:w-[42px] md:h-[42px] rounded-full flex items-center justify-center text-xs md:text-sm font-black border-[2.5px]"
        style={{
          background: coinGradient,
          borderColor: color,
          color: label === "MXN" ? "#0a1428" : label === "COP" ? "#3a2000" : "#fff",
        }}
      >
        {symbol}
      </div>
      <div
        className="text-base md:text-xl font-black tracking-wider"
        style={{ textShadow: `0 0 12px ${color}` }}
      >
        {label}
      </div>
      <style>{`
        @keyframes float${label} {
          0%, 100% { transform: rotateX(14deg) rotateY(-22deg) rotateZ(2deg) translateZ(${zOffset}px) translateY(0px); }
          50% { transform: rotateX(14deg) rotateY(-22deg) rotateZ(2deg) translateZ(${zOffset}px) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

// Inner phone card
function InnerCard({ symbol, label, className }: { symbol: string; label: string; className: string }) {
  return (
    <div className={`rounded-xl h-[70px] flex flex-col items-center justify-center gap-1 border transition-all duration-250 hover:scale-108 cursor-pointer ${className}`}>
      <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[8px] font-black border-[1.5px]">
        {symbol}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </div>
  );
}

// Phone mockup with 3D effects
export function PhoneMockup() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      setMousePos({ x: dx, y: dy });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const rX = 14 - mousePos.y * 5;
  const rY = -22 + mousePos.x * 8;
  const mobileTranslate = isMobile ? "translateX(-20px)" : "";

  return (
    <div 
      ref={sceneRef}
      className="relative w-[230px] h-[384px] md:w-[288px] md:h-[480px]"
      style={{ perspective: "1100px", perspectiveOrigin: "50% 45%" }}
    >
      {/* Phone wrapper */}
      <div
        className="absolute inset-0 transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: `${mobileTranslate} rotateX(${rX}deg) rotateY(${rY}deg) rotateZ(2deg)`,
        }}
      >
        {/* Phone body */}
        <div
          className="absolute inset-0 rounded-[44px] overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0d1e3a 0%, #05101f 60%, #020c1a 100%)",
            border: "2.5px solid rgba(0,200,255,0.55)",
            boxShadow: "0 0 28px rgba(0,200,255,0.55), 0 0 70px rgba(0,180,255,0.28), 0 0 130px rgba(0,160,255,0.14), inset 0 0 30px rgba(0,200,255,0.07), 0 30px 80px rgba(0,0,0,0.7)",
          }}
        >
          {/* Notch */}
          <div
            className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[90px] h-[22px] rounded-b-[14px] z-10"
            style={{
              background: "#020c1a",
              border: "1.5px solid rgba(0,200,255,0.3)",
              borderTop: "none",
            }}
          />

          {/* Screen */}
          <div
            className="absolute inset-[14px] rounded-[32px] flex flex-col items-center justify-end p-0 pb-9"
            style={{ background: "linear-gradient(175deg, #061224 0%, #030e1c 100%)" }}
          >
            {/* DOGGY image */}
            <Image
              src="/doggy.png"
              alt="DOGGY"
              width={200}
              height={200}
              className="absolute top-[45px] left-1/2 -translate-x-1/2 opacity-90 pointer-events-none"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.6))" }}
            />

            {/* Currency grid - hidden on mobile */}
            <div className="hidden md:grid grid-cols-2 gap-[14px] w-full px-6 mb-7 opacity-45">
              <InnerCard symbol="$" label="MXN" className="border-[#c8dcff33] text-[#c8dcff] bg-[#0a143250]" />
              <InnerCard symbol="$" label="ARG" className="border-[#9646ff33] text-[#c07eff] bg-[#0f0a2350]" />
              <InnerCard symbol="$" label="COP" className="border-[#ffb40033] text-[#ffd060] bg-[#140f0550]" />
              <InnerCard symbol="R$" label="BRL" className="border-[#00c85033] text-[#40f090] bg-[#05140a50]" />
            </div>

            {/* Buy button - always visible */}
            <button
              className="w-[160px] md:w-[220px] h-[40px] md:h-[48px] rounded-full text-white font-bold text-base md:text-lg tracking-wider"
              style={{
                background: "linear-gradient(90deg, #0075c9, #00b4ff, #0075c9)",
                backgroundSize: "200% 100%",
                border: "none",
                boxShadow: "0 0 18px rgba(0,180,255,0.8), 0 0 40px rgba(0,160,255,0.4), 0 4px 20px rgba(0,0,0,0.5)",
                animation: "btnPulse 2.4s ease-in-out infinite, btnShimmer 3s linear infinite",
                fontFamily: "'Rajdhani', sans-serif",
              }}
            >
              Comprar DOGGY
            </button>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute inset-0 pointer-events-auto" style={{ transformStyle: "preserve-3d" }}>
        <FloatingCard
          symbol="$"
          label="MXN"
          color="#c8dcff"
          gradient="rgba(200,220,255,0.4)"
          coinGradient="radial-gradient(circle, #c0cfe8, #7a8faa)"
          position={{ left: "-60px", top: "20px" }}
          zOffset={80}
          animationDelay="3.4s"
        />
        <FloatingCard
          symbol="$"
          label="ARG"
          color="#c07eff"
          gradient="rgba(160,80,255,0.45)"
          coinGradient="radial-gradient(circle, #9b4dcc, #5a1f8a)"
          position={{ right: "-40px", top: "20px" }}
          zOffset={75}
          animationDelay="3.8s"
        />
        <FloatingCard
          symbol="$"
          label="COP"
          color="#ffd060"
          gradient="rgba(255,180,0,0.45)"
          coinGradient="radial-gradient(circle, #e8a800, #b07000)"
          position={{ left: "-70px", top: "230px" }}
          zOffset={85}
          animationDelay="4.2s"
        />
        <FloatingCard
          symbol="R$"
          label="BRL"
          color="#40f090"
          gradient="rgba(0,230,100,0.4)"
          coinGradient="radial-gradient(circle, #00a850, #005a2a)"
          position={{ right: "-30px", top: "240px" }}
          zOffset={78}
          animationDelay="3.6s"
        />
      </div>

      <style>{`
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(0,180,255,0.8), 0 0 40px rgba(0,160,255,0.4), 0 4px 20px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 28px rgba(0,200,255,1), 0 0 60px rgba(0,180,255,0.6), 0 4px 20px rgba(0,0,0,0.5); }
        }
        @keyframes btnShimmer {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .scale-108:hover {
          box-shadow: 0 0 15px rgba(0,200,255,0.5), 0 0 35px rgba(0,200,255,0.3), inset 0 0 15px rgba(0,200,255,0.2);
        }
        @media (max-width: 768px) {
          .phone-body-mobile {
            transform: translateX(-20px) !important;
          }
        }
      `}</style>
    </div>
  );
}