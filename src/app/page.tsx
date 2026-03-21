"use client";

import { useEffect } from "react";
import { useAccount, useConnect } from "@particle-network/connectkit";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { AboutSection } from "@/components/AboutSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { AdvantagesSection } from "@/components/AdvantagesSection";
import { TeamSection } from "@/components/TeamSection";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  console.log("[LANDING] isConnected:", isConnected);

  useEffect(() => {
    console.log("[LANDING] useEffect fired, isConnected:", isConnected);
    if (isConnected) {
      console.log("[LANDING] Redirecting to /app");
      router.push("/app");
    }
  }, [isConnected, router]);

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#050d1f" }}>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <AdvantagesSection />
      <TeamSection />
    </main>
  );
}
