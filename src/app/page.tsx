import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { TheSkyWeLost } from "@/components/TheSkyWeLost";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#020617]">
      <Navbar />
      <HeroSection />
      <TheSkyWeLost />
    </main>
  );
}
