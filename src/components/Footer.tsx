import { Hexagon, Twitter, Linkedin, Github, Instagram, Send } from "lucide-react";

const navLinks = ["Page 1", "Page 2", "Page 3", "Page 4"];
const socialLinks = [
  { icon: <Twitter size={15} />, href: "#" },
  { icon: <Linkedin size={15} />, href: "#" },
  { icon: <Github size={15} />, href: "#" },
  { icon: <Instagram size={15} />, href: "#" },
  { icon: <Send size={15} />, href: "#" },
];

export function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: "rgba(4, 10, 22, 0.98)",
        borderTop: "1px solid rgba(0, 212, 255, 0.1)",
      }}
    >
      {/* Top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #00d4ff, #0055ff)" }}
            >
              <Hexagon size={14} color="white" fill="white" />
            </div>
            <span className="text-white font-bold text-base tracking-wide">CryptoDo</span>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="text-gray-500 hover:text-cyan-400 text-xs transition-colors"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Socials */}
          <div className="flex items-center gap-3">
            {socialLinks.map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-cyan-400 transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button
            className="px-5 py-2 rounded text-white text-xs"
            style={{
              background: "linear-gradient(135deg, #0055ff, #00aaff)",
              boxShadow: "0 0 14px rgba(0,170,255,0.3)",
            }}
          >
            Start a contract
          </button>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-gray-600 text-xs">
            © 2026 CryptoDo. All rights reserved.
          </p>
          <p className="text-gray-600 text-xs">
            Built on blockchain technology.{" "}
            <span className="text-cyan-600 cursor-pointer hover:text-cyan-400 transition-colors">
              Privacy Policy
            </span>{" "}
            ·{" "}
            <span className="text-cyan-600 cursor-pointer hover:text-cyan-400 transition-colors">
              Terms of Service
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}