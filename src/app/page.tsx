"use client";

import { useEffect } from "react";
import { useAccount } from "@particle-network/connectkit";
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

  useEffect(() => {
    if (isConnected) {
      router.push("/app");
      return;
    }
    const check = setInterval(() => {
      if (isConnected) { router.push("/app"); clearInterval(check); }
    }, 1000);
    return () => clearInterval(check);
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
