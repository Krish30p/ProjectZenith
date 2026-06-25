import { Navbar } from "@/components/Navbar";
import { AboutHero } from "@/components/about/AboutHero";
import { MissionSplit } from "@/components/about/MissionSplit";
import { SystemsGrid } from "@/components/about/SystemsGrid";
import { HowZenithWorks } from "@/components/about/HowZenithWorks";
import { ClosingManifesto } from "@/components/about/ClosingManifesto";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-900 selection:text-cyan-50">
      <Navbar />
      
      <div className="relative pt-24 pb-32">
        {/* Orbital Spine / Chapter Rail */}
        <div className="absolute left-6 md:left-[8%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-900/30 to-transparent hidden md:block z-0" />

        <div className="flex flex-col gap-32 md:gap-48 relative z-10">
          <AboutHero chapter="01" />
          <MissionSplit chapter="02" />
          <SystemsGrid chapter="03" />
          <HowZenithWorks chapter="04" />
          <ClosingManifesto chapter="05" />
        </div>
      </div>
    </main>
  );
}
