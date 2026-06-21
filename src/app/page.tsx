"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TheSkyWeLost } from "@/components/TheSkyWeLost";
import { CosmicTimeMachine } from "@/components/time-machine/CosmicTimeMachine";

export default function Home() {
  const [hasEnteredTimeMachine, setHasEnteredTimeMachine] = useState(false);

  return (
    <main className="relative min-h-screen bg-[#020617]">
      <Navbar />
      <HeroSection />
      <TheSkyWeLost onEnterTimeMachine={() => setHasEnteredTimeMachine(true)} />
      {hasEnteredTimeMachine && <CosmicTimeMachine />}
    </main>
  );
}
