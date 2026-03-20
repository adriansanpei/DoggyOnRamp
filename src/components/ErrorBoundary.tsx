"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const msg = event.message || "";
      // Detect hydration errors and force reload
      if (
        msg.includes("hydration") ||
        msg.includes("Minified React error") ||
        msg.includes("Client-side exception")
      ) {
        event.preventDefault();
        window.location.href = window.location.pathname;
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return <>{children}</>;
}
