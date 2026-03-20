import React from "react";

const advantages = [
  {
    id: "01",
    title: "Entrada mínima",
    description:
      "Desde $50 pesos ya eres holder DOGGY",
    subtitle: "No necesitas una lana. Con lo que cuesta una caguama ya tienes tu lugar en el cohete",
    color1: "#00d4ff",
    color2: "#0066ff",
    image: "/entrada-minima.png",
  },
  {
    id: "02",
    title: "Sin papeleo",
    description:
      "Sin banco, sin KYC",
    subtitle: "El onramp más simple de LATAM. Solo necesitas tu teléfono y hacer un SPEI. Listo",
    color1: "#FFD700",
    color2: "#FFA500",
    image: "/sin-papeleo.png",
  },
  {
    id: "03",
    title: "Referidos",
    description:
      "Invita y gana",
    subtitle: "Por cada amigo que entre con tu link, te llevas el 20% de lo que invierta. Automático, directo a tu wallet.",
    color1: "#7c4dff",
    color2: "#aa00ff",
    image: "/referidos.png",
  },
];

export function AdvantagesSection() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050d1f 0%, #07101f 50%, #050d1f 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(0,80,255,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Background watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{
          fontSize: "clamp(5rem, 16vw, 14rem)",
          fontWeight: 900,
          color: "rgba(255,255,255,0.018)",
          letterSpacing: "0.05em",
        }}
      >
        DOGGY
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Título blanco */}
        <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-6">
          Porque Doggy OnRamp
        </h2>
        <p className="text-center text-gray-400 text-sm max-w-2xl mx-auto mb-12 leading-relaxed">
          El onramp más accesible de LATAM. Sin complicaciones, sin barreras.
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {advantages.map((adv) => (
            <div
              key={adv.id}
              className="rounded-2xl p-6 text-center transition-transform hover:-translate-y-1 duration-300"
              style={{
                background: "rgba(8, 18, 45, 0.8)",
                border: `1px solid ${adv.color1}33`,
                boxShadow: `0 0 30px ${adv.color1}10, inset 0 0 30px ${adv.color1}05`,
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Imagen del icono */}
              <div className="w-48 h-48 mx-auto mb-6 relative">
                <img 
                  src={adv.image} 
                  alt={adv.title}
                  className="w-full h-full object-contain"
                  style={{
                    filter: `drop-shadow(0 0 20px ${adv.color1}66)`,
                  }}
                />
              </div>
              <h3 className="text-white text-lg font-bold mb-2">{adv.title}</h3>
              <p className="text-sm font-medium mb-2" style={{ color: adv.color1 }}>
                {adv.description}
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                {adv.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}