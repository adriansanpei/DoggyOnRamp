import React from "react";
import { Twitter, Instagram } from "lucide-react";

interface TeamMemberProps {
  name: string;
  lines: string[];
  imageUrl: string;
  socials: { icon: React.ReactNode; href: string }[];
}

function TeamCard({ name, lines, imageUrl, socials }: TeamMemberProps) {
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-500 group relative"
      style={{
        background: "rgba(8, 18, 45, 0.8)",
        boxShadow: "0 0 24px rgba(0, 100, 255, 0.08)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Border overlay que aparece en hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
        style={{
          boxShadow: "inset 0 0 0 2px rgba(0, 212, 255, 0.6), 0 0 40px rgba(0, 212, 255, 0.3), 0 0 60px rgba(255, 215, 0, 0.15)",
        }}
      />

      {/* Photo */}
      <div
        className="relative overflow-hidden"
        style={{ height: 320 }}
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover object-center"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(8, 18, 45, 1) 100%)",
          }}
        />
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="text-white text-lg font-bold mb-3">{name}</h3>

        {/* Lines de descripción - cada línea separada */}
        <div className="space-y-2 mb-4">
          {lines.map((line, i) => (
            <p key={i} className="text-gray-400 text-sm leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* Separator */}
        <div
          className="h-px w-full mb-4"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,212,255,0.3), transparent)",
          }}
        />

        {/* Socials */}
        <div className="flex items-center gap-4">
          {socials.map((s, i) => (
            <a
              key={i}
              href={s.href}
              className="text-gray-500 hover:text-cyan-400 transition-colors duration-200"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const teamMembers: TeamMemberProps[] = [
  {
    name: "Adrian",
    lines: [
      "Bitcoiner desde 2017",
      "Hizo 100x en su portafolio",
      "Creador de contenido cripto",
      "Cofundador de El Holder",
    ],
    imageUrl: "/adrian.jpg",
    socials: [
      { icon: <Twitter size={18} />, href: "#" },
      { icon: <Instagram size={18} />, href: "#" },
    ],
  },
  {
    name: "Isra",
    lines: [
      "Cripto bro desde 2017",
      "Creador de contenido para inversiones",
      "+200k followers",
    ],
    imageUrl: "/isra.jpg",
    socials: [
      { icon: <Twitter size={18} />, href: "#" },
      { icon: <Instagram size={18} />, href: "#" },
    ],
  },
];

export function TeamSection() {
  return (
    <section
      id="creadores"
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050d1f 0%, #071530 50%, #050d1f 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center bottom, rgba(0,80,255,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2
            className="text-white"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            Creadores de Doggy!
          </h2>
          <div
            className="h-px max-w-xs mx-auto mt-4"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)",
            }}
          />
        </div>

        {/* Team grid - 2 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member) => (
            <TeamCard key={member.name} {...member} />
          ))}
        </div>
      </div>
    </section>
  );
}