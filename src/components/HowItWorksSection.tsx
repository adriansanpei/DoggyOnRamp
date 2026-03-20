"use client";

interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

function StepCard({ step, title, description }: StepCardProps) {
  const accentColor = "#00d4ff";

  return (
    <div
      className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "rgba(8, 18, 45, 0.8)",
        border: `1px solid ${accentColor}33`,
        boxShadow: `0 0 30px ${accentColor}10, inset 0 0 30px ${accentColor}05`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-5"
        style={{
          background: `linear-gradient(135deg, #0066ff, #00d4ff)`,
          boxShadow: `0 0 20px rgba(0, 212, 255, 0.5)`,
        }}
      >
        {step}
      </div>
      <h3 className="text-white text-lg font-semibold mb-3">{title}</h3>
      <div
        className="h-px w-16 mx-auto mb-4"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}66, transparent)` }}
      />
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

const steps = [
  {
    title: "Crea tu cuenta",
    description: "Sin experiencia previa. Al registrarte, Doggy OnRamp genera tu wallet automáticamente — lista para recibir tokens desde el primer día.",
  },
  {
    title: "Tú decides cuánto",
    description: "Desde $50 MXN ya puedes entrar al mundo crypto. Sin montos mínimos absurdos, sin complicaciones.",
  },
  {
    title: "Sin papeleos",
    description: "No pedimos documentos ni datos personales. Tu identidad es tuya — tus tokens también.",
  },
  {
    title: "$DOGGY en tu wallet",
    description: "En minutos, tus tokens llegan directo a tu wallet. Así de simple. Así de rápido.",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050d1f 0%, #071a38 50%, #050d1f 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,100,255,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <h2
            className="text-white mb-4"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 700,
            }}
          >
            ¿Cómo Funciona DOGGY OnRamp?
          </h2>
          <div
            className="h-1 w-24 mx-auto rounded-full"
            style={{ background: "linear-gradient(90deg, #0066ff, #00d4ff)" }}
          />
        </div>

        {/* Steps grid - 4 en fila */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <StepCard
              key={i}
              step={i + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}