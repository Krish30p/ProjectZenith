"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TelemetryData } from "./IntelligencePanel";
import { formatDistanceToNow } from "date-fns";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
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

function getSkyQualityLabel(score: number) {
  if (score > 80) return { label: "Excellent", color: "text-[#00E5FF]" };
  if (score > 60) return { label: "Good", color: "text-[#00E5FF]/80" };
  if (score > 40) return { label: "Moderate", color: "text-amber-300" };
  if (score > 20) return { label: "Poor", color: "text-orange-400" };
  return { label: "Severe Obstruction", color: "text-red-400" };
}

function getGriefLabel(score: number) {
  if (score < 20) return "Pristine";
  if (score < 40) return "Minor Loss";
  if (score < 60) return "Noticeable Loss";
  if (score < 80) return "Severe Loss";
  return "Crisis";
}

export function CosmicBookOverlay({ isOpen, onClose, location, telemetry, issPass, issPassLoading }: CosmicBookOverlayProps) {
  const [spread, setSpread] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) setSpread(1);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSpread(2);
      if (e.key === 'ArrowLeft') setSpread(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !location || !telemetry) return null;

  const tz = telemetry.timezone || "UTC";
  const tzAbbr = telemetry.timezoneAbbr || tz;
  const localTime = new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false });
  const sqLabel = getSkyQualityLabel(telemetry.skyQualityScore || 0);
  const griefLabel = getGriefLabel(telemetry.orbitalGriefIndex);

  // Subtle paper texture overlay (SVG data URI)
  const paperTexture = 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.08%22/%3E%3C/svg%3E")';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 md:p-12 xl:p-16 pointer-events-none perspective-[2000px]">
      {/* Dimming Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#01030A]/70 backdrop-blur-md pointer-events-auto"
      />

      {/* Book Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, rotateX: 5 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.95, opacity: 0, rotateX: -5 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-7xl h-[85vh] min-h-[600px] pointer-events-auto flex items-center justify-center"
      >
        {/* Close Button (Floating outside the book) */}
        <button
          onClick={onClose}
          className="absolute -top-6 -right-6 md:-right-12 md:-top-6 p-3 bg-white/5 hover:bg-white/20 border border-white/20 rounded-full text-slate-300 hover:text-white backdrop-blur-md transition-all z-[60] group shadow-2xl"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* The Physical Book Object */}
        <div className="relative w-full h-full flex rounded-[2px] shadow-[0_30px_60px_rgba(0,0,0,0.8),_0_0_120px_rgba(0,229,255,0.05)] border border-white/10 bg-[#070b14]">
          
          {/* Outer Cover Backing (The thick hardcover edges) */}
          <div className="absolute -inset-1.5 -z-10 rounded-[6px] bg-gradient-to-b from-[#131b2f] to-[#04070d] border border-white/10 shadow-2xl overflow-hidden">
             {/* Cover texture */}
             <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: paperTexture }} />
          </div>

          {/* Stacked Page Edges (To simulate depth) */}
          <div className="absolute -inset-y-[2px] -right-[4px] w-[6px] bg-gradient-to-r from-slate-600 via-slate-400 to-slate-700 rounded-r shadow-inner opacity-40 z-0" />
          <div className="absolute -inset-y-[2px] -left-[4px] w-[6px] bg-gradient-to-l from-slate-600 via-slate-400 to-slate-700 rounded-l shadow-inner opacity-40 z-0" />

          {/* Book Inner Spread Container */}
          <div className="flex w-full h-full relative z-10 bg-[#09101d] rounded overflow-hidden">
            
            {/* The Spine (Center Fold) */}
            <div className="absolute inset-y-0 left-1/2 w-16 -ml-8 z-20 pointer-events-none flex">
               {/* Left side shadow diving into the gutter */}
               <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-black/80" />
               {/* Right side highlight emerging from the gutter */}
               <div className="w-1/2 h-full bg-gradient-to-r from-black/80 via-white/5 to-transparent" />
               {/* The actual seam */}
               <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/50 shadow-[0_0_10px_rgba(0,0,0,1)]" />
            </div>

            {/* Pagination Controls (Always visible anchors) */}
            <div className="absolute inset-y-0 right-0 w-16 md:w-24 z-30 flex items-center justify-center">
              {spread === 1 && (
                <button onClick={() => setSpread(2)} className="group flex flex-col items-center justify-center h-32 w-full hover:bg-white/5 transition-colors border-l border-transparent hover:border-white/10">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 mb-4 group-hover:text-[#00E5FF] transition-colors">Turn Page</span>
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-[#00E5FF] group-hover:translate-x-1 transition-all" />
                </button>
              )}
            </div>
            <div className="absolute inset-y-0 left-0 w-16 md:w-24 z-30 flex items-center justify-center">
              {spread === 2 && (
                <button onClick={() => setSpread(1)} className="group flex flex-col items-center justify-center h-32 w-full hover:bg-white/5 transition-colors border-r border-transparent hover:border-white/10">
                  <ChevronLeft className="w-5 h-5 text-slate-500 group-hover:text-[#00E5FF] group-hover:-translate-x-1 transition-all mb-4" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 group-hover:text-[#00E5FF] transition-colors">Previous</span>
                </button>
              )}
            </div>

            {/* Page Content Layers with Page-Turn Animations */}
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
                  <div className="flex-1 relative border-r border-black/40 px-12 md:px-24 py-16 flex flex-col justify-between" style={{ backgroundImage: paperTexture }}>
                    {/* Header Folio */}
                    <header className="flex justify-between items-start border-b border-white/10 pb-6">
                      <div>
                        <p className="text-xs font-mono tracking-widest text-[#00E5FF]/90 uppercase font-semibold">Celestial Dossier</p>
                        <h2 className="text-sm font-mono tracking-[0.2em] text-slate-300 mt-1 uppercase font-semibold">Observatory Target</h2>
                      </div>
                      <span className="text-xs font-mono text-slate-400 tracking-widest">PAGE I</span>
                    </header>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="mb-12">
                        <h1 className="text-5xl lg:text-6xl font-primary font-bold text-white tracking-tight leading-none mb-3">
                          {location.country}
                        </h1>
                        <h2 className="text-3xl font-primary text-slate-300 font-medium italic mb-2">
                          {location.name}
                        </h2>
                        {(location.nameNative && location.nameNative !== location.name) || (location.countryNative && location.countryNative !== location.country) ? (
                          <p className="text-xl text-slate-400 font-mono tracking-wide uppercase font-semibold mt-4">
                            {[
                              location.nameNative !== location.name ? location.nameNative : null,
                              location.countryNative !== location.country ? location.countryNative : null
                            ].filter(Boolean).join(' — ')}
                          </p>
                        ) : null}
                      </div>

                      {/* Editorial data layout */}
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6 border-l-2 border-[#00E5FF]/30 pl-6">
                        <div>
                          <p className="text-xs text-slate-400 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LATITUDE</p>
                          <p className="text-3xl text-slate-100 font-mono font-medium">{location.lat.toFixed(4)}°</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LONGITUDE</p>
                          <p className="text-3xl text-slate-100 font-mono font-medium">{location.lon.toFixed(4)}°</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">LOCAL TIME</p>
                          <p className="text-3xl text-[#00E5FF] font-mono font-medium">{localTime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 font-mono tracking-[0.2em] uppercase mb-2 font-semibold">TIMEZONE</p>
                          <p className="text-2xl text-slate-100 font-mono pt-1 font-medium">{tzAbbr}</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Annotation */}
                    <footer className="border-t border-white/10 pt-6 mt-12 flex justify-between items-end">
                       <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-[280px]">
                         Coordinates acquired and locked. Atmospheric and orbital analysis follows on the adjacent leaf.
                       </p>
                       <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Field Record</p>
                    </footer>
                  </div>

                  {/* PAGE II: Sky Conditions (Right) */}
                  <div className="flex-1 relative border-l border-white/5 px-12 md:px-24 py-16 flex flex-col justify-between" style={{ backgroundImage: paperTexture }}>
                    <header className="flex justify-between items-start border-b border-white/10 pb-6">
                      <span className="text-xs font-mono text-slate-400 tracking-widest">PAGE II</span>
                      <div className="text-right">
                        <p className="text-xs font-mono tracking-widest text-[#C084FC]/90 uppercase font-semibold">Meteorological Data</p>
                        <h2 className="text-sm font-mono tracking-[0.2em] text-slate-300 mt-1 uppercase font-semibold">Atmospheric Conditions</h2>
                      </div>
                    </header>

                    <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
                      <div className="space-y-10">
                        {/* Elegant Condition Blocks */}
                        <div className="relative pl-10 border-l-2 border-slate-600 pb-2">
                          <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-400 bg-[#09101d]" />
                          <p className="text-xs font-mono text-slate-400 tracking-[0.2em] uppercase mb-3 font-semibold">Moon Phase</p>
                          <p className="text-4xl text-white font-primary italic font-medium">{getMoonPhaseName(telemetry.moonPhase || 0)}</p>
                        </div>

                        <div className="relative pl-10 border-l-2 border-slate-600 pb-2">
                          <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-[#00E5FF]/60 bg-[#00E5FF]/20 shadow-[0_0_10px_rgba(0,229,255,0.4)]" />
                          <p className="text-xs font-mono text-slate-400 tracking-[0.2em] uppercase mb-3 font-semibold">Cloud Cover</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-5xl text-slate-100 font-mono font-medium">{telemetry.cloudCover}</p>
                            <span className="text-2xl text-slate-400 font-mono">%</span>
                          </div>
                        </div>

                        <div className="relative pl-10 border-l-2 border-slate-600 pb-2">
                          <div className="absolute left-[-6px] top-1.5 w-3 h-3 rounded-full border-2 border-emerald-500/60 bg-emerald-500/20" />
                          <p className="text-xs font-mono text-slate-400 tracking-[0.2em] uppercase mb-3 font-semibold">Atmospheric Visibility</p>
                          <p className="text-4xl text-slate-100 font-mono font-medium">
                            {telemetry.visibilityKm !== undefined ? `${telemetry.visibilityKm} km` : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <footer className="border-t border-white/10 pt-6 mt-12 flex justify-end">
                       <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase text-right max-w-[200px]">
                         Atmospheric Analysis Complete
                       </p>
                    </footer>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="spread2"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                  className="flex w-full h-full origin-right"
                >
                  {/* PAGE III: Quality & Grief (Left) */}
                  <div className="flex-1 relative border-r border-black/40 px-12 md:px-24 py-16 flex flex-col justify-between" style={{ backgroundImage: paperTexture }}>
                    <header className="flex justify-between items-start border-b border-white/10 pb-6">
                      <div>
                        <p className="text-xs font-mono tracking-widest text-emerald-400/90 uppercase font-semibold">Observation Viability</p>
                        <h2 className="text-sm font-mono tracking-[0.2em] text-slate-300 mt-1 uppercase font-semibold">Sky Quality Analysis</h2>
                      </div>
                      <span className="text-xs font-mono text-slate-400 tracking-widest">PAGE III</span>
                    </header>

                    <div className="flex-1 flex flex-col justify-center space-y-10 max-w-sm mx-auto w-full">
                      {/* Sky Quality */}
                      <div>
                        <div className="flex items-baseline gap-4 mb-4">
                          <span className={`text-[6rem] font-mono tracking-tighter leading-none ${sqLabel.color}`}>
                            {telemetry.skyQualityScore}
                          </span>
                          <span className={`text-3xl font-primary italic tracking-wide font-medium ${sqLabel.color}`}>
                            {sqLabel.label}
                          </span>
                        </div>
                        <p className="text-base text-slate-300 font-primary leading-relaxed border-l-2 border-white/20 pl-4 mt-6">
                          Conditions are currently affected by {telemetry.cloudCover > 50 ? 'heavy cloud cover' : 'atmospheric factors'} and {telemetry.orbitalGriefIndex > 50 ? 'significant' : 'moderate'} orbital traffic.
                        </p>
                      </div>

                      {/* Orbital Grief */}
                      <div className="relative mt-8">
                        <div className="absolute inset-0 bg-[#7C3AED]/10 rounded-3xl -m-6 -z-10 blur-xl" />
                        <h3 className="text-xs font-mono tracking-[0.2em] text-[#A78BFA] mb-6 uppercase text-center font-semibold">
                          Orbital Grief Index
                        </h3>
                        
                        <div className="scale-110 mb-6 transform origin-center">
                          <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} />
                        </div>
                        
                        <div className="flex justify-center mb-6">
                          <span className="text-sm font-mono text-white uppercase tracking-[0.2em] px-5 py-2 border border-[#7C3AED]/40 rounded bg-[#7C3AED]/10 font-semibold">
                            {griefLabel}
                          </span>
                        </div>

                        <div className="flex justify-between border-t border-white/10 pt-5 text-xs font-mono uppercase tracking-widest">
                           <span className="text-slate-400 font-semibold">Satellite Density: <span className="text-rose-400">High</span></span>
                           <span className="text-slate-400 font-semibold">Cloud: <span className="text-slate-200">{telemetry.cloudCover}%</span></span>
                        </div>
                      </div>
                    </div>

                    <footer className="border-t border-white/10 pt-6 mt-12 flex justify-between items-end">
                       <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-[280px]">
                         Index reflects visual obstruction caused by artificial satellites and debris.
                       </p>
                       <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Grief Metric</p>
                    </footer>
                  </div>

                  {/* PAGE IV: Above & Insight (Right) */}
                  <div className="flex-1 relative border-l border-white/5 px-12 md:px-24 py-16 flex flex-col justify-between" style={{ backgroundImage: paperTexture }}>
                    <header className="flex justify-between items-start border-b border-white/10 pb-6">
                      <span className="text-xs font-mono text-slate-400 tracking-widest">PAGE IV</span>
                      <div className="text-right">
                        <p className="text-xs font-mono tracking-widest text-amber-400/90 uppercase font-semibold">Celestial Objects</p>
                        <h2 className="text-sm font-mono tracking-[0.2em] text-slate-300 mt-1 uppercase font-semibold">Orbital Activity</h2>
                      </div>
                    </header>

                    <div className="flex-1 flex flex-col justify-center space-y-8 max-w-sm mx-auto w-full">
                      {/* Orbital Stats */}
                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-dashed border-white/20 pb-3">
                           <span className="text-sm font-mono text-slate-400 uppercase tracking-widest font-semibold">Satellites Above Horizon</span>
                           <span className="text-4xl text-slate-100 font-mono font-medium">{telemetry.satellitesOverhead ?? 0}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-dashed border-white/20 pb-3">
                           <span className="text-sm font-mono text-slate-400 uppercase tracking-widest font-semibold">Visible Planets</span>
                           <span className="text-2xl text-emerald-400 font-primary italic font-medium">
                             {telemetry.visiblePlanets?.length ? telemetry.visiblePlanets.join(", ") : "None"}
                           </span>
                        </div>
                        
                        <div className="pt-4">
                           <p className="text-xs font-mono tracking-[0.2em] text-[#00E5FF] uppercase mb-4 font-semibold">Next ISS Transit</p>
                           {issPassLoading ? (
                             <p className="text-base font-mono text-amber-400 animate-pulse font-medium">Calculating transit vector...</p>
                           ) : issPass?.nextPass ? (
                             <div className="bg-white/5 border border-white/20 p-5 rounded-xl">
                               <p className="text-3xl text-white font-mono mb-3 font-medium">{formatDistanceToNow(issPass.nextPass)}</p>
                               <div className="flex justify-between text-xs font-mono uppercase tracking-widest text-slate-300">
                                 <span>Max Elev: {issPass.maxElevationDegrees}°</span>
                                 <span>{new Date(issPass.nextPass).toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                               </div>
                             </div>
                           ) : (
                             <p className="text-base font-mono text-slate-400 font-medium">NO TRANSITS DETECTED (24H)</p>
                           )}
                        </div>
                      </div>

                      {/* AI Insight */}
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-2 h-2 bg-[#A78BFA] rounded-full" />
                          <h3 className="text-xs font-mono tracking-[0.2em] text-slate-300 uppercase font-semibold">Observer's Log</h3>
                        </div>
                        <p className="text-lg text-slate-200 font-primary italic leading-relaxed pl-5 border-l-2 border-[#7C3AED]/40">
                          "{telemetry.insight}"
                        </p>
                      </div>
                    </div>

                    <footer className="border-t border-white/10 pt-6 mt-12 flex justify-end">
                       <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase text-right max-w-[200px]">
                         End of Record
                       </p>
                    </footer>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
