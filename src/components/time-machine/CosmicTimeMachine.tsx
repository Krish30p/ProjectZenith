"use client";

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { COSMIC_TIME_MACHINE_YEARS, CosmicTimeMachineYear } from '@/lib/timeMachineData';
import { AlertTriangle, Activity, Aperture, ChevronDown, ArrowLeft } from 'lucide-react';

function CheckpointView({ 
  data, 
  index, 
  scrollYProgress 
}: { 
  data: CosmicTimeMachineYear; 
  index: number; 
  scrollYProgress: MotionValue<number>;
}) {
  // Spread the 6 checkpoints evenly across the timeline
  // Centers: 0.15, 0.30, 0.45, 0.60, 0.75, 0.90
  const center = 0.15 * (index + 1);
  const enterStart = center - 0.03;
  const lockStart = center - 0.01;
  const lockEnd = center + 0.01;
  const exitEnd = center + 0.03;

  const yTravel = useTransform(scrollYProgress, [enterStart, lockStart, lockEnd, exitEnd], [50, 0, 0, -50]);
  const opacity = useTransform(scrollYProgress, [enterStart, lockStart, lockEnd, exitEnd], [0, 1, 1, 0]);
  
  const dossierY = useTransform(scrollYProgress, [enterStart + 0.005, lockStart, lockEnd, exitEnd], [50, 0, 0, -50]);
  const dossierOpacity = useTransform(scrollYProgress, [enterStart + 0.005, lockStart, lockEnd, exitEnd], [0, 1, 1, 0]);
  
  const scale = useTransform(scrollYProgress, [enterStart, exitEnd], [0.95, 1.05]);

  // Determine if this checkpoint is currently the active one to toggle pointer events
  const [isActive, setIsActive] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest >= enterStart && latest <= exitEnd) {
      if (!isActive) setIsActive(true);
    } else {
      if (isActive) setIsActive(false);
    }
  });

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-12 md:px-24 xl:px-40"
      style={{ opacity, scale, pointerEvents: isActive ? 'auto' : 'none' }}
    >
      {/* LEFT: Year & Narrative */}
      <motion.div style={{ y: yTravel }} className="flex flex-col gap-4 max-w-2xl">
        <div className="flex flex-col items-start">
          <h1 className="text-[8rem] md:text-[10rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter drop-shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            {data.year}
          </h1>
          <div className={`mt-2 px-4 py-1.5 rounded-md border backdrop-blur-xl flex items-center gap-2 text-sm font-bold tracking-widest uppercase shadow-xl ${
            data.isProjected 
              ? 'border-[#FF3333]/50 bg-[#FF3333]/20 text-[#FF3333]'
              : 'border-[#00E5FF]/40 bg-[#00E5FF]/20 text-[#00E5FF]'
          }`}>
            {data.isProjected ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {data.eraLabel}
          </div>
        </div>
        
        <div className="mt-6 bg-[#020617]/85 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">{data.headline}</h3>
          <p className="text-lg text-[#00E5FF] mb-4 drop-shadow-md">{data.subheadline}</p>
          <p className="text-base text-slate-200 leading-relaxed drop-shadow-sm">
            {data.insightText}
          </p>
        </div>

        {index === COSMIC_TIME_MACHINE_YEARS.length - 1 && (
          <div className="mt-8 pointer-events-auto flex flex-col sm:flex-row gap-4">
            <a 
              href="/observatory"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#020617]/90 backdrop-blur-xl border border-[#00E5FF]/50 rounded-full hover:bg-[#00E5FF]/20 shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all cursor-pointer"
            >
              <span className="text-white font-bold tracking-wide drop-shadow-md">Enter Launch Observatory</span>
              <Aperture className="w-5 h-5 text-[#00E5FF] group-hover:rotate-90 transition-transform" />
            </a>
            <a 
              href="/"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-transparent border border-white/20 rounded-full hover:bg-white/5 hover:border-white/40 transition-all cursor-pointer"
            >
              <span className="text-white font-bold tracking-wide drop-shadow-md">Return to Home</span>
            </a>
          </div>
        )}
      </motion.div>

      {/* RIGHT: Dossier Card */}
      <motion.div style={{ y: dossierY, opacity: dossierOpacity }} className="hidden lg:block bg-[#020617]/85 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] w-96 relative overflow-hidden">
        {/* Subtle inner gradient to simulate a 'light' box feel while staying dark theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-100 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 uppercase tracking-widest mb-2 font-semibold drop-shadow-sm">Active Assets</span>
              <span className="text-4xl font-mono text-white tracking-tight drop-shadow-md">
                {data.activeSatellites.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-300 uppercase tracking-widest mb-2 font-semibold drop-shadow-sm">Congestion</span>
              <div className="flex items-end gap-1">
                <span className={`text-4xl font-mono tracking-tight drop-shadow-md ${data.congestionScore > 80 ? 'text-[#FF3333]' : 'text-white'}`}>
                  {data.congestionScore}
                </span>
                <span className="text-sm text-slate-400 font-mono mb-1 drop-shadow-sm">/100</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6" />

          <div className="flex flex-col gap-2">
            <span className="text-xs text-slate-300 uppercase tracking-widest font-semibold drop-shadow-sm">Sky Impact Score</span>
            <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div 
                className={`h-full rounded-full shadow-[0_0_10px_currentColor] ${data.skyImpactScore > 80 ? 'bg-[#FF3333] text-[#FF3333]' : 'bg-[#00E5FF] text-[#00E5FF]'}`}
                style={{ width: `${data.skyImpactScore}%` }}
              />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed font-medium drop-shadow-sm">
              {data.disclosureLabel}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProgressRail({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50 pointer-events-none">
      {COSMIC_TIME_MACHINE_YEARS.map((data, idx) => {
         const center = 0.15 * (idx + 1);
         // eslint-disable-next-line react-hooks/rules-of-hooks
         const opacity = useTransform(scrollYProgress, 
           [center - 0.03, center, center + 0.03], 
           [0.3, 1, 0.3]
         );
         
         return (
           <React.Fragment key={data.year}>
             <motion.div style={{ opacity }} className="text-xs md:text-sm font-mono tracking-widest text-white">
               {data.year}
             </motion.div>
             {idx < COSMIC_TIME_MACHINE_YEARS.length - 1 && (
               <div className="w-4 md:w-8 h-px bg-white/20" />
             )}
           </React.Fragment>
         )
      })}
    </div>
  );
}

export function CosmicTimeMachine() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { scrollYProgress } = useScroll({
    container: containerRef,
  });

  const portalScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (videoRef.current && videoRef.current.duration) {
      // Ensure smooth scrubbing by setting current time directly
      // Math.max/min to prevent out of bounds
      const targetTime = Math.max(0, Math.min(latest * videoRef.current.duration, videoRef.current.duration - 0.1));
      videoRef.current.currentTime = targetTime;
    }
  });

  // Entry hint opacity
  const entryHintOpacity = useTransform(scrollYProgress, [0, 0.03], [1, 0]);

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      ref={containerRef}
      className="fixed inset-0 z-50 w-full h-screen bg-[#01030A] overflow-y-auto scroll-smooth"
    >
      <a 
        href="/"
        className="fixed top-6 left-6 md:top-10 md:left-10 z-[100] flex items-center gap-2 px-5 py-2.5 bg-[#020617]/60 backdrop-blur-md border border-white/20 rounded-full text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/40 transition-all shadow-lg group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium tracking-widest uppercase">Home</span>
      </a>

      <div className="w-full h-[2400vh] relative">
        <div className="sticky top-0 w-full h-screen overflow-hidden bg-black">
          
          {/* Layer A: Video Portal */}
          <motion.div style={{ scale: portalScale }} className="absolute inset-0 w-full h-full transform-gpu">
            <video
              ref={videoRef}
              src="/time-machine-portal.mp4"
              className="w-full h-full object-cover opacity-60"
              muted
              playsInline
              preload="auto"
            />
          </motion.div>

          {/* Layer B: Depth & Atmosphere Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Soft volumetric vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(1,3,10,0.85)_100%)] z-10" />
            
            {/* Edge darkening */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-10" />
            
            {/* Atmospheric haze that increases with depth */}
            <motion.div 
              className="absolute inset-0 bg-[#00E5FF]/10 mix-blend-screen z-10"
              style={{ opacity: useTransform(scrollYProgress, [0, 1], [0, 0.6]) }}
            />
            
            {/* Additional red haze for the extreme projected future */}
            <motion.div 
              className="absolute inset-0 bg-[#FF3333]/10 mix-blend-screen z-10"
              style={{ opacity: useTransform(scrollYProgress, [0.7, 1], [0, 0.8]) }}
            />
          </div>

          {/* Layer C: UI / Narrative Layer */}
          <div className="absolute inset-0 z-20">
            {/* Initial scroll hint */}
            <motion.div 
              style={{ opacity: entryHintOpacity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-white/70 pointer-events-none"
            >
              <p className="text-sm tracking-[0.2em] uppercase font-medium">Scroll to enter the archive</p>
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </motion.div>

            {COSMIC_TIME_MACHINE_YEARS.map((data, index) => (
              <CheckpointView 
                key={data.year} 
                data={data} 
                index={index} 
                scrollYProgress={scrollYProgress} 
              />
            ))}
            
            <ProgressRail scrollYProgress={scrollYProgress} />
          </div>

        </div>
      </div>
    </motion.section>
  );
}
