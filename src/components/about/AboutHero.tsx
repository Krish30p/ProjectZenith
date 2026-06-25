"use client";

import { motion } from "framer-motion";
import { ChapterNode } from "./ChapterNode";

export function AboutHero({ chapter }: { chapter: string }) {
  return (
    <section className="relative min-h-[90vh] flex items-center w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-16">
      <ChapterNode chapter={chapter} label="DOSSIER" />
      
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center md:pl-[12%]">
        {/* Left Side: Text */}
        <div className="flex flex-col z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-8 h-px bg-cyan-500/50" />
            <span className="font-mono text-xs tracking-[0.2em] text-cyan-400 uppercase">Mission Dossier</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white mb-6"
          >
            The Mission <br/>
            <span className="text-slate-400">Behind Zenith</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg text-slate-300 leading-relaxed max-w-xl mb-12 font-light"
          >
            Zenith is a SpaceTech platform designed to translate the invisible orbital layer into a legible, interactive experience. It bridges the gap between complex celestial data and human observation, transforming Earth's sky into a living observatory.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, borderBottomColor: "transparent" }}
            animate={{ opacity: 1, borderBottomColor: "rgba(30,41,59,0.5)" }}
            transition={{ duration: 1, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-t border-b border-slate-800/50"
          >
            {[
              { label: "DOMAIN", value: "SPACE TECH" },
              { label: "MODE", value: "CELESTIAL INTEL" },
              { label: "SYSTEM", value: "LIVE OBSERVATORY" },
              { label: "STATUS", value: "ACTIVE" },
            ].map((item, i) => (
              <div key={item.label} className="flex flex-col gap-1">
                <span className="font-mono text-[10px] text-slate-500 tracking-wider">{item.label}</span>
                <span className="font-mono text-xs text-cyan-50 tracking-wider">{item.value}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Side: Visual Panel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          className="relative aspect-square sm:aspect-[4/5] lg:aspect-square w-full rounded-2xl overflow-hidden border border-slate-800/50 bg-[#030712] group"
        >
          {/* Base Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 mix-blend-luminosity group-hover:mix-blend-normal group-hover:opacity-80 transition-all duration-1000 ease-in-out"
            style={{ backgroundImage: 'url(/celestial-library-bg.jpg)' }}
          />
          
          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-transparent to-[#020617]/50" />
          
          {/* Linework / Blueprint Graphics */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            {/* Concentric rings */}
            <div className="w-[80%] h-[80%] rounded-full border border-cyan-500/20 absolute animate-[spin_60s_linear_infinite]" />
            <div className="w-[60%] h-[60%] rounded-full border border-dashed border-cyan-500/30 absolute animate-[spin_40s_linear_infinite_reverse]" />
            <div className="w-[40%] h-[40%] rounded-full border border-cyan-500/20 absolute" />
            
            {/* Crosshairs */}
            <div className="w-full h-px bg-cyan-500/20 absolute top-1/2" />
            <div className="h-full w-px bg-cyan-500/20 absolute left-1/2" />
          </div>

          {/* Glowing node at center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
        </motion.div>
      </div>
    </section>
  );
}
