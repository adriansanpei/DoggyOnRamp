"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useModal } from "@particle-network/connectkit";

const navLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Qué es DOGGY", href: "#que-es" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Creadores", href: "#creadores" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setOpen } = useModal();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-4"
      style={{
        background: "rgba(5, 13, 31, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0, 200, 255, 0.08)",
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span
            className="text-white font-bold text-xl tracking-wide"
            style={{ 
              fontFamily: "sans-serif",
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            $DOGGY
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-400 hover:text-yellow-400 text-sm transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right side - CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button 
            className="px-5 py-2 rounded text-sm text-black font-semibold"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
              boxShadow: "0 0 16px rgba(255, 215, 0, 0.35)",
            }}
            onClick={() => setOpen(true)}
          >
            Comprar DOGGY
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden mt-4 pb-4 flex flex-col gap-3 px-2"
          style={{ borderTop: "1px solid rgba(0,200,255,0.1)" }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-gray-400 hover:text-yellow-400 text-sm py-1"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button 
            className="px-5 py-2 rounded text-sm text-black font-semibold mt-2 w-fit"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
            }}
            onClick={() => setOpen(true)}
          >
            Comprar DOGGY
          </button>
        </div>
      )}
    </nav>
  );
}