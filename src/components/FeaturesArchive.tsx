"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Telescope, Map, Clock, Eye, FileText, Satellite, Activity } from "lucide-react";
import Image from "next/image";

interface FeatureData {
  id: string;
  title: string;
  label: string;
  icon: any;
  description: string;
  howItWorks: string;
  howToUse: string;
  systems?: string[];
  impact?: string;
  proTip?: string;
}

const features: FeatureData[] = [
  {
    id: "launch-observatory",
    title: "Launch Observatory",
    label: "Live 3D Telemetry",
    icon: Telescope,
    description: "A real-time 3D globe visualizing orbital mechanics and celestial telemetry. Track live satellite passes, view cloud cover, and assess ground visibility in real time.",
    howItWorks: "We pipe live TLE (Two-Line Element) datasets from CelesTrak and map them onto an interactive Cesium Ion engine, cross-referencing live meteorological data.",
    howToUse: "Rotate the globe to find your location, or search directly. Click on any orbital object to view its trajectory, and read the atmospheric cards to gauge if tonight is clear enough for a stargazing session.",
    systems: ["Cesium Ion", "CelesTrak TLEs", "Open-Meteo"],
    impact: "Provides the immediate situational awareness needed to plan real-world observation.",
  },
  {
    id: "location-atlas",
    title: "Location Atlas / Cosmic Book",
    label: "Personalized Visual Sky",
    icon: Map,
    description: "An elegant, generated celestial portrait of the sky above your exact coordinates right now.",
    howItWorks: "It fuses local time, lunar phase, cloud density, and sky quality scores into a layered visual canvas (from twilight gradients to thick cloud veils).",
    howToUse: "Select any location on the globe and open the Atlas. Turn the pages to read the generated observer's log, review viability scores, and view the final Sky Impression spread.",
    impact: "Transforms raw data into a beautiful, human-readable atmospheric forecast.",
  },
  {
    id: "cosmic-time",
    title: "Cosmic Time Machine",
    label: "Historical Trajectories",
    icon: Clock,
    description: "Travel backward or forward in time to observe the celestial configurations of major historical events.",
    howItWorks: "Uses robust astronomy engines to reverse-calculate the exact planetary positions and satellite deployments of the past.",
    howToUse: "Enter a specific date in the timeline dial, or choose a historical event marker, and watch the observatory rewind to that exact moment.",
    systems: ["Astronomy Engine", "Historical Ephemeris"],
    proTip: "Try rewinding to the launch date of the ISS to see its initial orbital insertion.",
  },
  {
    id: "orbital-lens",
    title: "Orbital Lens",
    label: "Layered Constellations",
    icon: Eye,
    description: "A filtering tool to isolate specific networks, such as GPS, Starlink, or weather satellites, to understand the density of our near-Earth orbit.",
    howItWorks: "Categories are dynamically filtered from the main TLE stream, adjusting the 3D rendering to emphasize only the requested orbital shells.",
    howToUse: "Toggle the lens filters on the right side of the observatory to highlight or dim different orbital populations.",
  },
  {
    id: "satellite-dossiers",
    title: "Satellite Dossiers",
    label: "Spacecraft Intelligence",
    icon: FileText,
    description: "Deep-dive intelligence files on individual spacecraft, covering their mission purpose, altitude, and velocity.",
    howItWorks: "Pulls metadata associated with NORAD IDs and formats it into an elegant, readable archival card.",
    howToUse: "Click on any specific satellite on the globe to open its dossier for a detailed mission readout.",
  },
  {
    id: "iss-tracking",
    title: "ISS Tracking & Passes",
    label: "Overhead Intelligence",
    icon: Satellite,
    description: "Instantaneous calculations of the International Space Station's trajectory and upcoming visual passes for your location.",
    howItWorks: "Runs a native 24-hour orbital projection engine using satellite.js, calculating exact elevation and azimuth without waiting for rate-limited external APIs.",
    howToUse: "Check the 'Next ISS Transit' panel in your Location Atlas to see exactly when and where to look up.",
    systems: ["satellite.js", "Native Propagation"],
    impact: "Never miss an overhead pass of the largest human-made structure in space.",
  },
  {
    id: "sky-quality",
    title: "Orbital Grief & Sky Quality",
    label: "Atmospheric Analysis",
    icon: Activity,
    description: "A proprietary metric evaluating how much of the natural night sky has been lost to light pollution and orbital clutter.",
    howItWorks: "Aggregates localized light pollution data, cloud cover, and satellite density to output a 'Grief Index' and a 'Sky Quality Score'.",
    howToUse: "Review the metric in your Cosmic Book to understand if your selected location offers pristine stargazing or a compromised view.",
    impact: "Quantifies the emotional and visual impact of losing our connection to the stars.",
  }
];

export function FeaturesArchive() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };
    
    // Add event listener to the window so we track even if cursor leaves the immediate section
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const nextFeature = () => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const prevFeature = () => {
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  // Calculate parallax offsets based on mouse position relative to center of screen
  const parallaxX = typeof window !== 'undefined' ? (mousePosition.x - window.innerWidth / 2) * -0.015 : 0;
  const parallaxY = typeof window !== 'undefined' ? (mousePosition.y - window.innerHeight / 2) * -0.015 : 0;

  return (
    <section id="features" ref={containerRef} className="relative w-full min-h-screen py-24 overflow-hidden flex flex-col bg-[#010409]">
      {/* Interactive Atmospheric Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div 
          animate={{ x: parallaxX, y: parallaxY }}
          transition={{ type: "spring", stiffness: 100, damping: 30, mass: 0.5 }}
          className="absolute inset-[-5%] w-[110%] h-[110%]"
        >
          <Image
            src="/featuresbg.png"
            alt="Celestial Library"
            fill
            className="object-cover object-center opacity-100"
          />
        </motion.div>
        
        {/* Dark masking layer that reveals the image under the cursor */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(0,0,0,0) 0%, rgba(2,6,23,0.2) 50%, rgba(1,4,9,0.5) 100%)`
          }}
        />

        {/* Additive light effect to actively brighten the dark background */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 mix-blend-screen transition-opacity duration-300 opacity-80"
          style={{
            background: `radial-gradient(circle 500px at ${mousePosition.x}px ${mousePosition.y}px, rgba(212,175,55,0.4) 0%, rgba(100,150,255,0.1) 40%, transparent 100%)`
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] pointer-events-none opacity-50" />
      </div>

      <div className="relative z-10 container mx-auto px-6 h-full flex flex-col pt-12">
        
        {/* Header Block */}
        <header className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-serif text-[#fdfaf3] tracking-widest uppercase mb-6 drop-shadow-xl">Celestial Archive</h2>
        </header>

        {/* Feature Index Strip */}
        <div className="flex flex-nowrap items-center justify-between w-full gap-2 mb-16 overflow-x-auto custom-scrollbar pb-2">
          {features.map((feature, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex-1 whitespace-nowrap px-3 md:px-4 py-2 rounded-full border transition-all duration-300 text-[9px] md:text-[10px] uppercase font-mono tracking-widest flex items-center justify-center gap-2
                  ${isActive 
                    ? 'border-[#d4af37]/50 bg-[#d4af37]/10 text-[#d4af37]' 
                    : 'border-white/10 bg-black/20 text-slate-400 hover:border-white/30 hover:text-slate-200'
                  }`}
              >
                <feature.icon className="w-3 h-3 shrink-0" />
                <span className="hidden lg:inline">{feature.title}</span>
                <span className="lg:hidden">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Carousel Stage */}
        <div className="relative h-[650px] w-full flex items-center justify-center perspective-[1200px]">
          
          <div className="absolute inset-y-0 w-full max-w-7xl flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {features.map((feature, idx) => {
                // Calculate distance from active index
                // We handle wrapping around the array visually
                let diff = idx - activeIndex;
                if (diff > features.length / 2) diff -= features.length;
                if (diff < -features.length / 2) diff += features.length;

                // Only render max 5 cards: center (0), left (-1, -2), right (1, 2)
                if (Math.abs(diff) > 2) return null;

                const isCenter = diff === 0;

                // Visual arc calculations
                const xOffset = diff * 320; // Spread them horizontally
                const yOffset = Math.abs(diff) * 40; // Curve downwards
                const scale = isCenter ? 1 : Math.max(0.7, 1 - Math.abs(diff) * 0.15);
                const opacity = isCenter ? 1 : Math.max(0.3, 0.7 - Math.abs(diff) * 0.2);
                const zIndex = 50 - Math.abs(diff);

                return (
                  <motion.div
                    key={feature.id}
                    layout
                    initial={{ opacity: 0, x: xOffset + (diff > 0 ? 100 : -100) }}
                    animate={{ 
                      x: xOffset, 
                      y: yOffset, 
                      scale, 
                      opacity, 
                      zIndex,
                      rotateY: diff * -15 // Slight turning inward
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className={`absolute flex flex-col ${isCenter ? 'w-[480px] md:w-[550px]' : 'w-[320px] pointer-events-none'}`}
                  >
                    <div className={`relative overflow-hidden rounded-sm transition-all duration-500
                      ${isCenter 
                        ? 'bg-[#0a0f18]/90 backdrop-blur-md border border-[#d4af37]/20 shadow-[0_0_50px_rgba(212,175,55,0.05)]' 
                        : 'bg-[#02050a]/80 backdrop-blur-sm border border-white/5 shadow-2xl brightness-50'
                      }`}
                    >
                      {/* Inner border for that premium dossier look */}
                      <div className="absolute inset-[2px] border border-white/5 rounded-sm pointer-events-none" />
                      
                      {isCenter ? (
                        /* ACTIVE DOSSIER LAYOUT */
                        <div className="p-8 md:p-10 flex flex-col h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                          {/* A) Header Block */}
                          <header className="mb-8 pb-6 border-b border-white/10 relative">
                            <div className="absolute top-0 right-0 opacity-20"><feature.icon className="w-12 h-12 text-[#d4af37]" /></div>
                            <span className="text-[10px] font-mono text-[#d4af37] tracking-[0.2em] uppercase mb-2 block">{feature.label}</span>
                            <h3 className="text-2xl font-serif text-[#fdfaf3] tracking-wider uppercase mb-4">{feature.title}</h3>
                            <p className="text-sm font-serif italic text-slate-300 leading-relaxed">
                              {feature.description}
                            </p>
                          </header>

                          {/* B) Main Content Split */}
                          <div className="space-y-6 flex-1">
                            <div>
                              <h4 className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-2">How it works</h4>
                              <p className="text-sm text-slate-300 font-sans leading-relaxed">{feature.howItWorks}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mb-2">How to use it</h4>
                              <p className="text-sm text-slate-300 font-sans leading-relaxed">{feature.howToUse}</p>
                            </div>

                            {feature.proTip && (
                              <div className="bg-[#d4af37]/5 border border-[#d4af37]/20 p-4 rounded-sm mt-4">
                                <h4 className="text-[9px] font-mono text-[#d4af37]/80 tracking-[0.2em] uppercase mb-1">Pro Tip</h4>
                                <p className="text-xs text-[#d4af37]/90 font-serif italic">{feature.proTip}</p>
                              </div>
                            )}
                          </div>

                          {/* C) Bottom Metadata Strip */}
                          <footer className="mt-8 pt-6 border-t border-white/10">
                            {feature.impact && (
                              <div className="mb-4">
                                <span className="text-[9px] font-mono text-slate-500 tracking-[0.2em] uppercase block mb-1">Impact</span>
                                <p className="text-xs text-slate-400 italic font-serif">{feature.impact}</p>
                              </div>
                            )}
                            {feature.systems && (
                              <div className="flex flex-wrap gap-2">
                                {feature.systems.map(sys => (
                                  <span key={sys} className="px-2 py-1 bg-black/40 border border-white/10 rounded-sm text-[9px] font-mono text-slate-400 tracking-widest uppercase">
                                    {sys}
                                  </span>
                                ))}
                              </div>
                            )}
                          </footer>
                        </div>
                      ) : (
                        /* INACTIVE SLEEPING VOLUME LAYOUT */
                        <div className="p-8 flex flex-col items-center justify-center h-[400px] text-center opacity-60">
                          <feature.icon className="w-8 h-8 text-slate-500 mb-6" />
                          <h3 className="text-lg font-serif text-slate-300 tracking-wider uppercase mb-2">{feature.title}</h3>
                          <span className="text-[9px] font-mono text-slate-600 tracking-[0.2em] uppercase">Sleeping Archive</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-8 mt-12 mb-8">
          <button 
            onClick={prevFeature}
            className="group flex items-center gap-3 px-6 py-3 border border-white/10 rounded-full hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 group-hover:text-[#d4af37] transition-colors">Previous</span>
          </button>
          
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
            Record {activeIndex + 1} / {features.length}
          </div>

          <button 
            onClick={nextFeature}
            className="group flex items-center gap-3 px-6 py-3 border border-white/10 rounded-full hover:border-[#d4af37]/50 hover:bg-[#d4af37]/5 transition-all"
          >
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-slate-400 group-hover:text-[#d4af37] transition-colors">Next</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#d4af37] transition-colors" />
          </button>
        </div>

      </div>
    </section>
  );
}
