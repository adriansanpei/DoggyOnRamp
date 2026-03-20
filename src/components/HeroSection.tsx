"use client";
import { PhoneMockup } from "@/components/PhoneMockup";
import { useModal } from "@particle-network/connectkit";

export function HeroSection() {
  const { setOpen } = useModal();
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      style={{ 
        background: "linear-gradient(160deg, #0A0F1E 0%, #0D1530 60%, #080D1A 100%)",
      }}
    >
      {/* Background orbs */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(245,166,35,0.13) 0%, transparent 70%)",
          top: "-200px",
          left: "-200px",
          animation: "drift1 12s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,229,255,0.11) 0%, transparent 70%)",
          bottom: "-100px",
          right: "-100px",
          animation: "drift2 15s ease-in-out infinite alternate",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Background watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: "clamp(6rem, 18vw, 16rem)",
          fontWeight: 900,
          color: "rgba(255,255,255,0.02)",
          letterSpacing: "0.1em",
          userSelect: "none",
        }}
      >
        DOGGY
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h1
              className="mb-9"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(64px, 15vw, 120px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-3px",
                animation: "fadeUp 0.6s ease 0.1s both",
              }}
            >
              <span className="block text-white">COMPRA</span>
              <span 
                className="block"
                style={{
                  background: "linear-gradient(90deg, #00E5FF 0%, #F5A623 30%, #FFD080 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "shine 4s linear infinite",
                }}
              >
                DOGGY
              </span>
            </h1>

            <p 
              className="text-lg md:text-[22px] leading-relaxed mb-11 max-w-md"
              style={{
                color: "rgba(255,255,255,0.5)",
                fontWeight: 300,
                animation: "fadeUp 0.6s ease 0.2s both",
              }}
            >
              Desde <strong style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>$50 pesos</strong> con tu cuenta bancaria.<br />
              Sin KYC. Sin complicaciones. Sin esperas.
            </p>

            <div 
              className="flex flex-col gap-4"
              style={{ animation: "fadeUp 0.6s ease 0.3s both" }}
            >
              {[
                "Pago por SPEI en segundos",
                "Tokens en tu wallet automáticamente",
                "3% comisión. Nada más.",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3.5">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background: "rgba(0,229,255,0.08)",
                      border: "1.5px solid rgba(0,229,255,0.35)",
                      color: "#00E5FF",
                    }}
                  >
                    ✓
                  </div>
                  <span 
                    className="text-base md:text-lg"
                    style={{ color: "rgba(255,255,255,0.65)", fontWeight: 300 }}
                  >
                    {text}
                  </span>
                </div>
              ))}
              
              {/* Auth Button */}
              <div className="mt-8" style={{ animation: "fadeUp 0.6s ease 0.4s both" }}>
                <button className="px-6 py-3 rounded-lg text-sm font-semibold" style={{background:"linear-gradient(135deg,#FFD700 0%,#FFA500 100%)",color:"#000"}} onClick={() => setOpen(true)}>Comprar ahora</button>
              </div>
            </div>
          </div>

          {/* Right: Phone mockup with animation */}
          <div className="flex justify-end md:pr-16 lg:pr-24">
            <PhoneMockup />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(8,13,26,0.8))" }}
      />

      <style>{`
        @keyframes drift1 {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(80px,60px) scale(1.15); }
        }
        @keyframes drift2 {
          from { transform: translate(0,0) scale(1); }
          to { transform: translate(-60px,-80px) scale(1.2); }
        }
        @keyframes shine {
          to { background-position: 200% center; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}