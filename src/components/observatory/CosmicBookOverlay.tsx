"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TelemetryData } from "./IntelligencePanel";
import { formatDistanceToNow } from "date-fns";
import { X, ChevronLeft, ChevronRight, BookOpen, Cloud, Eye, Activity, MapPin, Moon } from "lucide-react";
import OrbitalGriefGauge from "./OrbitalGriefGauge";

interface CosmicBookOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lon: number; name: string; nameNative?: string; country: string; countryNative?: string } | null;
  telemetry: TelemetryData | null;
  issPass: { nextPass: number | null, maxElevationDegrees: number | null } | null;
  issPassLoading: boolean;
}

function getMoonPhaseName(deg: number) {
  const n = deg % 360;
  if (n < 10 || n > 350) return "New Moon";
  if (n < 80)  return "Waxing Crescent";
  if (n < 100) return "First Quarter";
  if (n < 170) return "Waxing Gibbous";
  if (n < 190) return "Full Moon";
  if (n < 260) return "Waning Gibbous";
  if (n < 280) return "Last Quarter";
  return "Waning Crescent";
}

function getSkyQualityTheme(score: number) {
  if (score > 80) return { label: "Excellent", color: "text-[#008a99]", ring: "stroke-[#008a99]" };
  if (score > 60) return { label: "Good", color: "text-[#2e7d32]", ring: "stroke-[#2e7d32]" };
  if (score > 40) return { label: "Moderate", color: "text-[#d97706]", ring: "stroke-[#d97706]" };
  if (score > 20) return { label: "Poor", color: "text-[#c2410c]", ring: "stroke-[#c2410c]" };
  return { label: "Severe", color: "text-[#be123c]", ring: "stroke-[#be123c]" };
}

function getGriefLabel(score: number) {
  if (score < 20) return "Pristine";
  if (score < 40) return "Minor Loss";
  if (score < 60) return "Noticeable Loss";
  if (score < 80) return "Severe Loss";
  return "Crisis";
}

function generateSkyNote(telemetry: TelemetryData): string {
  const { cloudCover, skyQualityScore = 0, visiblePlanets = [] } = telemetry;
  let cloudText = "A clear canopy tonight";
  if (cloudCover > 80) cloudText = "A thick cloud veil obscures the view";
  else if (cloudCover > 40) cloudText = "Scattered clouds drift across the field of view";
  else if (cloudCover > 10) cloudText = "A light atmospheric haze is present";

  let qualityText = "with excellent visibility for celestial observation.";
  if (skyQualityScore < 40) qualityText = "though ground light significantly reduces stellar depth.";
  else if (skyQualityScore < 70) qualityText = "offering moderate observation conditions.";
  
  let planetText = "";
  if (visiblePlanets.length > 0 && cloudCover < 80) {
    planetText = ` ${visiblePlanets.length === 1 ? 'A lone planet marks' : 'Several planets mark'} the current sky.`;
  }

  return `${cloudText}, ${qualityText}${planetText}`;
}

export function CosmicBookOverlay({ isOpen, onClose, location, telemetry, issPass, issPassLoading }: CosmicBookOverlayProps) {
  const [spread, setSpread] = useState<0 | 1 | 2 | 3>(0);

  useEffect(() => {
    if (isOpen) setSpread(0);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (spread === 1) setSpread(2);
        else if (spread === 2) setSpread(3);
      }
      if (e.key === 'ArrowLeft') {
        if (spread === 2) setSpread(1);
        else if (spread === 3) setSpread(2);
      }
      if (e.key === 'Enter' && spread === 0) setSpread(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, spread]);

  if (!isOpen || !location || !telemetry) return null;

  const tz = telemetry.timezone || "UTC";
  const tzAbbr = telemetry.timezoneAbbr || tz;
  const localTime = new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false });
  const sqTheme = getSkyQualityTheme(telemetry.skyQualityScore || 0);
  const griefLabel = getGriefLabel(telemetry.orbitalGriefIndex);

  // Subtle paper texture overlay (SVG data URI) for light parchment theme
  const paperTexture = 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E")';
  // Darker texture for cover
  const coverTexture = 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.15%22/%3E%3C/svg%3E")';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 md:p-12 xl:p-16 pointer-events-none perspective-[2000px]">
      {/* Cinematic Blur Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#01030A]/90 backdrop-blur-xl pointer-events-auto"
      />
      {/* Soft spotlight behind the book */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[80vw] h-[80vh] bg-[#fdfaf3]/5 blur-[120px] rounded-full" />
      </motion.div>

      <AnimatePresence mode="wait">
        {spread === 0 ? (
          // CLOSED BOOK COVER STATE
          <motion.div
            key="closed-book"
            initial={{ y: 50, opacity: 0, rotateX: 5, rotateY: -10 }}
            animate={{ y: 0, opacity: 1, rotateX: 0, rotateY: 0 }}
            exit={{ rotateY: -90, x: -100, scale: 1.1, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-lg h-[75vh] min-h-[550px] pointer-events-auto cursor-pointer group perspective-[2000px]"
            onClick={() => setSpread(1)}
          >
            {/* Close Button */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="absolute -top-6 -right-6 md:-right-12 md:-top-6 p-3 bg-white/5 hover:bg-white/20 border border-white/20 rounded-full text-slate-300 hover:text-white backdrop-blur-md transition-all z-[60] shadow-2xl"
            >
              <X className="w-5 h-5 transition-transform duration-300" />
            </button>

            {/* Book Cover Design */}
            <motion.div
              whileHover={{ scale: 1.02, rotateY: -4, rotateX: 2 }}
              animate={{ y: [0, -5, 0] }}
              transition={{ 
                scale: { type: "spring", stiffness: 300, damping: 20 },
                y: { duration: 6, repeat: Infinity, ease: "easeInOut" } 
              }}
              className="w-full h-full relative rounded-r-xl shadow-[0_30px_80px_rgba(0,0,0,0.9),_20px_0_120px_rgba(10,25,50,0.4)] border-y border-r border-[#1a2f4c]/80 border-l-[28px] border-l-[#050a12] bg-[#0c1627] flex items-center justify-center overflow-hidden origin-left"
            >
              <div className="absolute inset-0 mix-blend-multiply opacity-80" style={{ backgroundImage: coverTexture }} />
              
              {/* Spine detailing */}
              <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-black/90 via-white/5 to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-y-0 left-1 w-[1px] bg-white/10 z-20 pointer-events-none" />
              <div className="absolute inset-y-0 left-3 w-[1px] bg-[#d4af37]/20 z-20 pointer-events-none" />
              
              {/* Gold foil corner ornaments */}
              <div className="absolute top-4 left-6 w-8 h-8 border-t border-l border-[#d4af37]/40 pointer-events-none" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#d4af37]/40 pointer-events-none" />
              <div className="absolute bottom-4 left-6 w-8 h-8 border-b border-l border-[#d4af37]/40 pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#d4af37]/40 pointer-events-none" />
              
              {/* Central foil geometry */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180%] aspect-square rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] aspect-square rounded-full border border-[#d4af37]/10 pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full border border-[#d4af37]/20 border-dashed pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] aspect-square rounded-full border border-[#d4af37]/30 pointer-events-none" />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#d4af37]/80 shadow-[0_0_15px_rgba(212,175,55,0.6)] pointer-events-none" />

              {/* Cover Content */}
              <div className="relative z-30 flex flex-col items-center justify-center text-center p-10 h-full w-full">
                
                <div className="mb-20">
                  <p className="text-[10px] font-serif tracking-[0.3em] text-[#d4af37]/80 uppercase mb-4">Zenith</p>
                  <h1 className="text-4xl md:text-5xl font-serif text-[#fdfaf3] tracking-widest leading-tight mb-4 drop-shadow-md">
                    LOCATION<br/>ATLAS
                  </h1>
                  <p className="text-[9px] font-mono tracking-[0.2em] text-slate-400 uppercase">Celestial Observatory Dossier</p>
                </div>

                {/* Bottom Section */}
                <div className="mt-auto pb-12 w-full space-y-8 flex flex-col items-center">
                  <div className="space-y-3">
                    <p className="text-[9px] font-serif tracking-[0.2em] text-[#d4af37]/70 uppercase">Prepared for the sky above</p>
                    <p className="text-2xl font-serif text-[#fdfaf3] tracking-wide uppercase">{location.name}</p>
                    <p className="text-xs font-serif text-slate-400 tracking-widest uppercase">{location.country}</p>
                  </div>
                  
                  <div className="w-12 h-[1px] bg-[#d4af37]/30 mx-auto" />
                  
                  <div className="space-y-1">
                     <p className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">Every place has a sky.</p>
                     <p className="text-[9px] font-mono tracking-widest text-[#d4af37]/60 uppercase">This one is yours to observe.</p>
                  </div>
                </div>

                {/* Interaction Prompt (absolute bottom) */}
                <div className="absolute -bottom-16 text-center w-full">
                  <motion.div 
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex items-center gap-2 text-[10px] font-mono text-slate-400 tracking-[0.2em] uppercase"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Click book to open</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // OPEN BOOK STATE
          <motion.div
            key="open-book"
            initial={{ rotateY: 90, scale: 0.9, opacity: 0, filter: "blur(10px)" }}
            animate={{ rotateY: 0, scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-6xl h-[85vh] min-h-[600px] pointer-events-auto flex items-center justify-center perspective-[2000px] origin-left"
          >
            {/* Close Button (Floating outside the book) */}
            <button
              onClick={onClose}
              className="absolute -top-6 -right-6 md:-right-12 md:-top-6 p-3 bg-white/5 hover:bg-white/20 border border-white/20 rounded-full text-slate-300 hover:text-white backdrop-blur-md transition-all z-[60] group shadow-2xl"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* The Physical Book Object */}
            <div className="relative w-full h-full flex rounded-[2px] shadow-[0_40px_80px_rgba(0,0,0,0.9),_0_0_150px_rgba(253,250,243,0.05)] bg-[#0c1627] border border-[#1a2f4c]">
              
              {/* Outer Cover Backing (The thick hardcover edges showing behind pages) */}
              <div className="absolute -inset-2 -z-10 rounded-[6px] bg-[#0c1627] border border-[#1a2f4c] shadow-2xl overflow-hidden">
                 <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: coverTexture }} />
              </div>

              {/* Stacked Page Edges (To simulate paper depth) */}
              <div className="absolute -inset-y-[1px] -right-[5px] w-[5px] bg-[#d9d2c5] rounded-r shadow-inner z-0" />
              <div className="absolute -inset-y-[1px] -left-[5px] w-[5px] bg-[#d9d2c5] rounded-l shadow-inner z-0" />

              {/* Book Inner Spread Container (The Paper) */}
              <div className="flex w-full h-full relative z-10 bg-[#fdfaf3] rounded-[1px] overflow-hidden text-[#1a2b3c]">
                <div className="absolute inset-0 opacity-[0.85] mix-blend-multiply pointer-events-none" style={{ backgroundImage: paperTexture }} />
                
                {/* The Spine (Center Fold Shadow) */}
                <div className="absolute inset-y-0 left-1/2 w-24 -ml-12 z-20 pointer-events-none flex">
                   {/* Left side shadow diving into the gutter */}
                   <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-black/30" />
                   {/* Right side shadow emerging from the gutter */}
                   <div className="w-1/2 h-full bg-gradient-to-r from-black/30 via-black/5 to-transparent" />
                   {/* The actual seam */}
                   <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                </div>

                {/* Pagination Controls (Ribbons or margin labels) */}
                <div className="absolute inset-y-0 right-0 w-16 md:w-20 z-30 flex items-center justify-center pointer-events-none">
                  {(spread === 1 || spread === 2) && (
                    <button onClick={() => setSpread((spread + 1) as 2 | 3)} className="pointer-events-auto group flex flex-col items-center justify-center p-4 hover:bg-[#1a2b3c]/5 transition-all rounded-l-xl">
                      <span className="text-[10px] font-serif text-[#1a2b3c]/60 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 mb-3 group-hover:text-[#1a2b3c] transition-colors">Turn Page</span>
                      <ChevronRight className="w-5 h-5 text-[#1a2b3c]/60 group-hover:text-[#1a2b3c] group-hover:translate-x-1 transition-all" />
                    </button>
                  )}
                </div>
                <div className="absolute inset-y-0 left-0 w-16 md:w-20 z-30 flex items-center justify-center pointer-events-none">
                  {(spread === 2 || spread === 3) && (
                    <button onClick={() => setSpread((spread - 1) as 1 | 2)} className="pointer-events-auto group flex flex-col items-center justify-center p-4 hover:bg-[#1a2b3c]/5 transition-all rounded-r-xl">
                      <ChevronLeft className="w-5 h-5 text-[#1a2b3c]/60 group-hover:text-[#1a2b3c] group-hover:-translate-x-1 transition-all mb-3" />
                      <span className="text-[10px] font-serif text-[#1a2b3c]/60 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 group-hover:text-[#1a2b3c] transition-colors">Previous</span>
                    </button>
                  )}
                </div>

                {/* Page Content Layers */}
                <AnimatePresence mode="wait" initial={false}>
                  {spread === 1 ? (
                    <motion.div
                      key="spread1"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                      className="flex w-full h-full origin-left"
                    >
                      {/* PAGE I: Active Target (Left) */}
                      <div className="flex-1 relative border-r border-black/10 px-12 md:px-24 py-16 flex flex-col justify-between">
                        {/* Header Folio */}
                        <header className="flex justify-between items-start border-b border-[#1a2b3c]/10 pb-6">
                          <div>
                            <p className="text-[10px] font-serif tracking-widest text-[#1a2b3c]/70 uppercase font-semibold">Celestial Dossier</p>
                            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#1a2b3c]/90 mt-1 uppercase">Observatory Target</h2>
                          </div>
                          <span className="text-[10px] font-serif text-[#1a2b3c]/60 tracking-widest">PAGE I</span>
                        </header>

                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="mb-12">
                            <h1 className="text-4xl lg:text-5xl font-serif text-[#1a2b3c] tracking-widest uppercase leading-tight mb-3">
                              {location.country}
                            </h1>
                            <h2 className="text-3xl font-serif text-[#1a2b3c]/80 font-medium italic mb-2">
                              {location.name}
                            </h2>
                            {(location.nameNative && location.nameNative !== location.name) || (location.countryNative && location.countryNative !== location.country) ? (
                              <p className="text-lg text-[#1a2b3c]/60 font-mono tracking-wide uppercase mt-4">
                                {[
                                  location.nameNative !== location.name ? location.nameNative : null,
                                  location.countryNative !== location.country ? location.countryNative : null
                                ].filter(Boolean).join(' — ')}
                              </p>
                            ) : null}
                          </div>

                          {/* Editorial data layout */}
                          <div className="grid grid-cols-2 gap-x-12 gap-y-8 border-l-2 border-[#1a2b3c]/20 pl-6">
                            <div>
                              <p className="text-[10px] text-[#1a2b3c]/50 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LATITUDE</p>
                              <p className="text-2xl text-[#1a2b3c] font-mono">{location.lat.toFixed(4)}°</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#1a2b3c]/50 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LONGITUDE</p>
                              <p className="text-2xl text-[#1a2b3c] font-mono">{location.lon.toFixed(4)}°</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#1a2b3c]/50 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LOCAL TIME</p>
                              <p className="text-2xl text-[#1a2b3c] font-mono">{localTime}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#1a2b3c]/50 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">TIMEZONE</p>
                              <p className="text-xl text-[#1a2b3c] font-mono pt-1">{tzAbbr}</p>
                            </div>
                          </div>
                        </div>

                        {/* Footer Annotation */}
                        <footer className="border-t border-[#1a2b3c]/10 pt-6 mt-12 flex justify-between items-end">
                           <p className="text-[10px] text-[#1a2b3c]/60 font-serif italic leading-relaxed max-w-[280px]">
                             Coordinates acquired and locked. Atmospheric and orbital analysis follows on the adjacent leaf.
                           </p>
                           <p className="text-[9px] font-mono text-[#1a2b3c]/40 tracking-widest uppercase">Field Record</p>
                        </footer>
                      </div>

                      {/* PAGE II: Sky Conditions (Right) */}
                      <div className="flex-1 relative border-l border-white/5 px-12 md:px-24 py-16 flex flex-col justify-between">
                        <header className="flex justify-between items-start border-b border-[#1a2b3c]/10 pb-6">
                          <span className="text-[10px] font-serif text-[#1a2b3c]/60 tracking-widest">PAGE II</span>
                          <div className="text-right">
                            <p className="text-[10px] font-serif tracking-widest text-[#1a2b3c]/70 uppercase font-semibold">Meteorological Data</p>
                            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#1a2b3c]/90 mt-1 uppercase">Atmospheric Conditions</h2>
                          </div>
                        </header>

                        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                          <div className="space-y-12">
                            {/* Elegant Condition Blocks */}
                            <div className="relative pl-10 border-l-2 border-[#1a2b3c]/20 pb-2">
                              <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-[#1a2b3c]/40 bg-[#fdfaf3]" />
                              <p className="text-[10px] font-mono text-[#1a2b3c]/60 tracking-[0.2em] uppercase mb-3 font-semibold">Moon Phase</p>
                              <p className="text-3xl text-[#1a2b3c] font-serif italic">{getMoonPhaseName(telemetry.moonPhase || 0)}</p>
                            </div>

                            <div className="relative pl-10 border-l-2 border-[#1a2b3c]/20 pb-2">
                              <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-[#1a2b3c]/40 bg-[#fdfaf3]" />
                              <p className="text-[10px] font-mono text-[#1a2b3c]/60 tracking-[0.2em] uppercase mb-3 font-semibold">Cloud Cover</p>
                              <div className="flex items-baseline gap-2">
                                <p className="text-4xl text-[#1a2b3c] font-mono">{telemetry.cloudCover}</p>
                                <span className="text-2xl text-[#1a2b3c]/50 font-mono">%</span>
                              </div>
                            </div>

                            <div className="relative pl-10 border-l-2 border-[#1a2b3c]/20 pb-2">
                              <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-[#1a2b3c]/40 bg-[#fdfaf3]" />
                              <p className="text-[10px] font-mono text-[#1a2b3c]/60 tracking-[0.2em] uppercase mb-3 font-semibold">Atmospheric Visibility</p>
                              <p className="text-3xl text-[#1a2b3c] font-mono">
                                {telemetry.visibilityKm !== undefined ? `${telemetry.visibilityKm} km` : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <footer className="border-t border-[#1a2b3c]/10 pt-6 mt-12 flex justify-end">
                           <p className="text-[9px] font-mono text-[#1a2b3c]/40 tracking-widest uppercase text-right max-w-[200px]">
                             Atmospheric Analysis Complete
                           </p>
                        </footer>
                      </div>
                    </motion.div>
                  ) : spread === 2 ? (
                    <motion.div
                      key="spread2"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                      className="flex w-full h-full origin-right"
                    >
                      {/* PAGE III: Quality & Grief (Left) */}
                      <div className="flex-1 relative border-r border-black/10 px-12 md:px-24 py-16 flex flex-col justify-between">
                        <header className="flex justify-between items-start border-b border-[#1a2b3c]/10 pb-6">
                          <div>
                            <p className="text-[10px] font-serif tracking-widest text-[#1a2b3c]/70 uppercase font-semibold">Observation Viability</p>
                            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#1a2b3c]/90 mt-1 uppercase">Sky Quality Analysis</h2>
                          </div>
                          <span className="text-[10px] font-serif text-[#1a2b3c]/60 tracking-widest">PAGE III</span>
                        </header>

                        <div className="flex-1 flex flex-col justify-center space-y-10 max-w-sm mx-auto w-full">
                          {/* Sky Quality */}
                          <div>
                            <div className="flex items-baseline gap-4 mb-4">
                              <span className={`text-[6rem] font-serif tracking-tighter leading-none ${sqTheme.color}`}>
                                {telemetry.skyQualityScore}
                              </span>
                              <span className={`text-2xl font-serif italic tracking-wide ${sqTheme.color}`}>
                                {sqTheme.label}
                              </span>
                            </div>
                            <p className="text-sm text-[#1a2b3c]/80 font-serif leading-relaxed border-l-2 border-[#1a2b3c]/20 pl-4 mt-6">
                              Conditions are currently affected by {telemetry.cloudCover > 50 ? 'heavy cloud cover' : 'atmospheric factors'} and {telemetry.orbitalGriefIndex > 50 ? 'significant' : 'moderate'} orbital traffic.
                            </p>
                          </div>

                          {/* Orbital Grief */}
                          <div className="relative mt-8">
                            <div className="scale-110 mb-6 transform origin-center">
                              <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} theme="light" />
                            </div>
                            
                            <div className="flex justify-center mb-6 mt-2">
                              <span className="text-[10px] font-mono text-[#1a2b3c]/80 uppercase tracking-[0.2em] px-4 py-1.5 border border-[#1a2b3c]/20 rounded font-semibold">
                                {griefLabel}
                              </span>
                            </div>

                            <div className="flex justify-between border-t border-[#1a2b3c]/10 pt-5 text-[10px] font-mono uppercase tracking-widest">
                               <span className="text-[#1a2b3c]/60 font-semibold">Satellite Density: <span className="text-[#c2410c]">High</span></span>
                               <span className="text-[#1a2b3c]/60 font-semibold">Cloud: <span className="text-[#1a2b3c]">{telemetry.cloudCover}%</span></span>
                            </div>
                          </div>
                        </div>

                        <footer className="border-t border-[#1a2b3c]/10 pt-6 mt-12 flex justify-between items-end">
                           <p className="text-[10px] text-[#1a2b3c]/60 font-serif italic leading-relaxed max-w-[280px]">
                             Index reflects visual obstruction caused by artificial satellites and debris.
                           </p>
                           <p className="text-[9px] font-mono text-[#1a2b3c]/40 tracking-widest uppercase">Grief Metric</p>
                        </footer>
                      </div>

                      {/* PAGE IV: Above & Insight (Right) */}
                      <div className="flex-1 relative border-l border-white/5 px-12 md:px-24 py-16 flex flex-col justify-between">
                        <header className="flex justify-between items-start border-b border-[#1a2b3c]/10 pb-6">
                          <span className="text-[10px] font-serif text-[#1a2b3c]/60 tracking-widest">PAGE IV</span>
                          <div className="text-right">
                            <p className="text-[10px] font-serif tracking-widest text-[#1a2b3c]/70 uppercase font-semibold">Celestial Objects</p>
                            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#1a2b3c]/90 mt-1 uppercase">Orbital Activity</h2>
                          </div>
                        </header>

                        <div className="flex-1 flex flex-col justify-center space-y-10 max-w-sm mx-auto w-full">
                          {/* Orbital Stats */}
                          <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-3">
                               <span className="text-[11px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Satellites Above Horizon</span>
                               <span className="text-3xl text-[#1a2b3c] font-mono">{telemetry.satellitesOverhead ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-3">
                               <span className="text-[11px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Visible Planets</span>
                               <span className="text-xl text-[#008a99] font-serif italic">
                                 {telemetry.visiblePlanets?.length ? telemetry.visiblePlanets.join(", ") : "None"}
                               </span>
                            </div>
                            
                            <div className="pt-4">
                               <p className="text-[10px] font-mono tracking-[0.2em] text-[#1a2b3c]/80 uppercase mb-4 font-semibold">Next ISS Transit</p>
                               {issPassLoading ? (
                                 <p className="text-sm font-mono text-[#d97706] animate-pulse">Calculating transit vector...</p>
                               ) : issPass?.nextPass ? (
                                 <div className="border border-[#1a2b3c]/10 p-5 rounded-sm">
                                   <p className="text-2xl text-[#1a2b3c] font-mono mb-3">{formatDistanceToNow(issPass.nextPass)}</p>
                                   <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest text-[#1a2b3c]/60">
                                     <span>Max Elev: {issPass.maxElevationDegrees}°</span>
                                     <span>{new Date(issPass.nextPass).toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                                   </div>
                                 </div>
                               ) : (
                                 <p className="text-sm font-mono text-[#1a2b3c]/50">NO TRANSITS DETECTED (24H)</p>
                               )}
                            </div>
                          </div>

                          {/* AI Insight */}
                          <div>
                            <div className="flex items-center gap-3 mb-5">
                              <div className="w-2 h-2 bg-[#1a2b3c]/20 rounded-full" />
                              <h3 className="text-[10px] font-mono tracking-[0.2em] text-[#1a2b3c]/70 uppercase font-semibold">Observer's Log</h3>
                            </div>
                            <p className="text-lg text-[#1a2b3c]/90 font-serif italic leading-relaxed pl-5 border-l-2 border-[#1a2b3c]/20">
                              "{telemetry.insight}"
                            </p>
                          </div>
                        </div>

                        <footer className="border-t border-[#1a2b3c]/10 pt-6 mt-12 flex justify-end">
                           <p className="text-[9px] font-mono text-[#1a2b3c]/40 tracking-widest uppercase text-right max-w-[200px]">
                             End of Record
                           </p>
                        </footer>
                      </div>
                    </motion.div>
                  ) : spread === 3 ? (
                    <motion.div
                      key="spread3"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                      className="flex w-full h-full origin-right"
                    >
                      {/* PAGE V: Sky Impression Intro (Left) */}
                      <div className="flex-1 relative border-r border-black/10 px-12 md:px-24 py-16 flex flex-col justify-between z-10">
                        <header className="flex justify-between items-start border-b border-[#1a2b3c]/10 pb-6">
                          <div>
                            <p className="text-[10px] font-serif tracking-widest text-[#1a2b3c]/70 uppercase font-semibold">Visual Sky Portrait</p>
                            <h2 className="text-[11px] font-mono tracking-[0.2em] text-[#1a2b3c]/90 mt-1 uppercase">Sky Impression</h2>
                          </div>
                          <span className="text-[10px] font-serif text-[#1a2b3c]/60 tracking-widest">PAGE V</span>
                        </header>

                        <div className="flex-1 flex flex-col justify-center space-y-10">
                          <div>
                            <h1 className="text-3xl font-serif text-[#1a2b3c] tracking-widest uppercase mb-1">{location.name}</h1>
                            <p className="text-sm text-[#1a2b3c]/60 font-mono tracking-widest uppercase mb-6">{localTime}</p>
                            <p className="text-xl text-[#1a2b3c]/80 font-serif italic leading-relaxed border-l-2 border-[#1a2b3c]/20 pl-5">
                              {generateSkyNote(telemetry)}
                            </p>
                          </div>
                          
                          <div className="border-t border-[#1a2b3c]/10 pt-6">
                            <ul className="space-y-3">
                              <li className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-2">
                                <span className="text-[10px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Moon Phase</span>
                                <span className="text-sm text-[#1a2b3c] font-serif italic">{getMoonPhaseName(telemetry.moonPhase || 0)}</span>
                              </li>
                              <li className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-2">
                                <span className="text-[10px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Cloud Cover</span>
                                <span className="text-sm text-[#1a2b3c] font-mono">{telemetry.cloudCover}%</span>
                              </li>
                              <li className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-2">
                                <span className="text-[10px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Visibility</span>
                                <span className="text-sm text-[#1a2b3c] font-mono">{telemetry.visibilityKm !== undefined ? `${telemetry.visibilityKm} km` : 'Unknown'}</span>
                              </li>
                              {telemetry.visiblePlanets && telemetry.visiblePlanets.length > 0 && (
                                <li className="flex justify-between items-end border-b border-dashed border-[#1a2b3c]/20 pb-2">
                                  <span className="text-[10px] font-mono text-[#1a2b3c]/60 uppercase tracking-widest font-semibold">Planets</span>
                                  <span className="text-sm text-[#008a99] font-serif italic">{telemetry.visiblePlanets.join(", ")}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <footer className="border-t border-[#1a2b3c]/10 pt-6 mt-12 flex justify-between items-end">
                           <p className="text-[10px] text-[#1a2b3c]/60 font-serif italic leading-relaxed max-w-[280px]">
                             Generated locally via live observational telemetry.
                           </p>
                           <p className="text-[9px] font-mono text-[#1a2b3c]/40 tracking-widest uppercase">Atmospheric Rendering</p>
                        </footer>
                      </div>

                      {/* PAGE VI: Sky Impression Canvas (Right) */}
                      <div className="flex-1 relative border-l border-white/5 bg-[#020617] overflow-hidden rounded-r-[1px] shadow-inner z-10">
                        {/* Atmosphere Base Gradient */}
                        <div className={`absolute inset-0 transition-colors duration-1000 ${
                          parseInt(localTime.split(':')[0], 10) >= 17 && parseInt(localTime.split(':')[0], 10) <= 19 
                            ? "bg-gradient-to-b from-[#041024] via-[#0e2142] to-[#261f36]" 
                            : parseInt(localTime.split(':')[0], 10) >= 4 && parseInt(localTime.split(':')[0], 10) <= 6
                              ? "bg-gradient-to-b from-[#020b17] via-[#0a1930] to-[#242b36]"
                              : "bg-gradient-to-b from-[#010409] via-[#041024] to-[#0a1a36]"
                        }`} />

                        {/* Star Field */}
                        <div className="absolute inset-0 pointer-events-none" style={{ opacity: (telemetry.skyQualityScore || 50) / 100 }}>
                          <svg width="100%" height="100%">
                            <filter id="noise">
                              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                              <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 5 -2" />
                            </filter>
                            <rect width="100%" height="100%" fill="transparent" filter="url(#noise)" opacity="0.4" />
                          </svg>
                          {/* Generated specific star points */}
                          {Array.from({ length: Math.floor((telemetry.skyQualityScore || 50) * 1.5) }).map((_, i) => (
                            <div key={i} className="absolute bg-white rounded-full" style={{ 
                              left: `${Math.random() * 100}%`, 
                              top: `${Math.random() * 90}%`, 
                              width: `${Math.random() * 1.5 + 0.5}px`, 
                              height: `${Math.random() * 1.5 + 0.5}px`, 
                              opacity: Math.random() * 0.8 + 0.1 
                            }} />
                          ))}
                        </div>

                        {/* Cloud Veil */}
                        {telemetry.cloudCover > 5 && (
                          <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-[var(--cloud-opacity)]" style={{ '--cloud-opacity': (telemetry.cloudCover / 100) * 0.8 } as React.CSSProperties}>
                            <svg width="100%" height="100%" preserveAspectRatio="none">
                              <filter id="cloudTurbulence">
                                <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" seed="42" />
                                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 3 -1" />
                              </filter>
                              <rect width="100%" height="100%" fill="white" filter="url(#cloudTurbulence)" />
                            </svg>
                          </div>
                        )}

                        {/* Moon */}
                        <div className="absolute top-20 right-20 w-14 h-14 rounded-full overflow-hidden shadow-[0_0_40px_rgba(253,250,243,0.3)] bg-black">
                          <div className="absolute inset-0 bg-[#fdfaf3]" />
                          {/* Shading overlay to simulate phase */}
                          <div className="absolute inset-0 bg-[#020617] scale-110" style={{ 
                            transform: `translateX(${((telemetry.moonPhase || 0) / 360) * 150 - 75}%) scaleX(${Math.abs(Math.cos(((telemetry.moonPhase || 0) * Math.PI) / 180))})`,
                            borderRadius: '50%'
                          }} />
                        </div>

                        {/* Visible Planets */}
                        {telemetry.visiblePlanets && telemetry.visiblePlanets.length > 0 && (
                          <div className="absolute inset-0 pointer-events-none">
                            {telemetry.visiblePlanets.map((planet, i) => {
                              // Distribute roughly across an arc
                              const px = 20 + i * (60 / Math.max(1, telemetry.visiblePlanets!.length - 1));
                              const py = 25 + Math.sin((px * Math.PI) / 100) * 20 + (i % 2 === 0 ? -5 : 5);
                              return (
                                <div key={planet} className="absolute flex flex-col items-center" style={{ left: `${px}%`, top: `${py}%` }}>
                                  <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full shadow-[0_0_12px_rgba(212,175,55,0.8)] animate-pulse" />
                                  <span className="text-[9px] font-serif italic text-[#d4af37]/80 mt-1.5 tracking-wider">{planet}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Horizon Silhouette */}
                        <svg className="absolute bottom-0 w-full h-32 text-[#010205] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                          <path d="M0,100 L0,70 Q10,65 25,75 T50,68 T75,78 T100,65 L100,100 Z" fill="currentColor" />
                          {/* Distant observatory dome hint */}
                          <path d="M70,78 Q75,70 80,78 Z" fill="currentColor" />
                        </svg>

                        <div className="absolute bottom-6 right-8 pointer-events-none">
                          <p className="text-[9px] font-mono tracking-[0.3em] text-white/20 uppercase">Observatory Line of Sight</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
