"use client";

import { useEffect, useState } from "react";

export function SparkleButton({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="sparkle-button"
        style={{
          "--active": isActive ? 1 : 0,
        } as React.CSSProperties}
        onMouseEnter={() => setIsActive(true)}
        onMouseLeave={() => setIsActive(false)}
      >
        <span className="spark" />
        <span className="backdrop" />
        <span className="text">{children}</span>
      </button>
      
      <style>{`
        .sparkle-button {
          --active: 0;
          --bg: radial-gradient(
              40% 50% at center 100%,
              hsl(270 calc(var(--active) * 97%) 72% / var(--active)),
              transparent
            ),
            radial-gradient(
              80% 100% at center 120%,
              hsl(260 calc(var(--active) * 97%) 70% / var(--active)),
              transparent
            ),
            hsl(260 calc(var(--active) * 97%) calc((var(--active) * 44%) + 12%));
          background: var(--bg);
          font-size: 1.2rem;
          font-weight: 500;
          border: 0;
          cursor: pointer;
          padding: 1em 1.5em;
          display: flex;
          align-items: center;
          gap: 0.25em;
          white-space: nowrap;
          border-radius: 100px;
          position: relative;
          box-shadow: 0 0 calc(var(--active) * 3em) calc(var(--active) * 1em) hsl(260 97% 61% / 0.75),
            0 0em 0 0 hsl(260 calc(var(--active) * 97%) calc((var(--active) * 50%) + 30%)) inset,
            0 -0.05em 0 0 hsl(260 calc(var(--active) * 97%) calc(var(--active) * 60%)) inset;
          scale: calc(1 + (var(--active) * 0.1));
          transition: 0.3s;
        }

        .sparkle-button:active {
          scale: 1;
        }

        .spark {
          position: absolute;
          inset: 0;
          border-radius: 100px;
          overflow: hidden;
          pointer-events: none;
        }

        .spark::before {
          content: "";
          position: absolute;
          width: 200%;
          aspect-ratio: 1;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(-90deg);
          opacity: calc(var(--active) + 0.4);
          background: conic-gradient(
            from 0deg,
            transparent 0 340deg,
            white 360deg
          );
          animation: rotate 2s linear infinite;
          animation-play-state: var(--active) == 1 ? running : paused;
        }

        .backdrop {
          position: absolute;
          inset: 0;
          background: var(--bg);
          border-radius: 100px;
          z-index: 0;
        }

        .sparkle-button .text {
          position: relative;
          z-index: 1;
          letter-spacing: 0.01ch;
          background: linear-gradient(
            90deg,
            hsl(0 0% calc((var(--active) * 100%) + 65%)),
            hsl(0 0% calc((var(--active) * 100%) + 26%))
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        @keyframes rotate {
          to {
            transform: translateX(-50%) rotate(270deg);
          }
        }
      `}</style>
    </div>
  );
}