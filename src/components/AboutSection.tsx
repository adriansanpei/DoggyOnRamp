"use client";

import { Button } from "@/components/ui/Button";
import Image from "next/image";

export function AboutSection() {
  return (
    <section
      id="que-es"
      className="relative py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #050d1f 0%, #071a38 50%, #050d1f 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(212,175,55,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute right-0 top-1/3 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: DOGGY Image */}
          <div className="relative flex justify-center">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 0 60px rgba(212,175,55,0.2), 0 0 100px rgba(0,212,255,0.1)",
              }}
            >
              <Image
                src="/ques-es-doggy.jpg"
                alt="¿Qué es DOGGY?"
                width={500}
                height={500}
                className="object-cover"
                priority
              />
              {/* Glow overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.1) 0%, transparent 50%, rgba(0,212,255,0.1) 100%)",
                }}
              />
            </div>
          </div>

          {/* Right: About text */}
          <div className="text-center md:text-left">
            <h2
              className="text-white mb-6"
              style={{
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                fontWeight: 700,
                letterSpacing: "0.02em",
              }}
            >
              ¿Qué es{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #d4af37, #ffd700)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                DOGGY
              </span>
              ?
            </h2>
            <p
              className="text-gray-300 leading-relaxed mb-8"
              style={{
                fontSize: "clamp(1rem, 2vw, 1.25rem)",
                lineHeight: "1.8",
              }}
            >
              Es la <span className="text-cyan-400 font-semibold">memecoin mexicana</span> creada
              para la comunidad latina, nacida en un live para celebrar el grito de independencia.
            </p>
            <Button
              variant="outline"
              className="group"
              onClick={() => window.open("https://eldoggy.com/", "_blank")}
            >
              <span className="flex items-center gap-2">
                Web de Doggy
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}