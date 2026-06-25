"use client";

import { motion } from "framer-motion";
import { ChapterNode } from "./ChapterNode";
import { LocateFixed, Globe2, Clock, Eye, Database, Orbit } from "lucide-react";

const SYSTEMS = [
  {
    name: "Launch Observatory",
    purpose: "Real-time visualization of orbital traffic and conditions.",
    label: "MAIN INTERFACE",
    icon: Globe2
  },
  {
    name: "Location Atlas",
    purpose: "Geospatial indexing of local celestial visibility.",
    label: "DATA CORE",
    icon: LocateFixed
  },
  {
    name: "Cosmic Time Machine",
    purpose: "Navigate past and future orbital and planetary states.",
    label: "TEMPORAL ENGINE",
    icon: Clock
  },
  {
    name: "Orbital Lens",
    purpose: "Focused tracking of specific satellites and trajectories.",
    label: "TARGETING",
    icon: Eye
  },
  {
    name: "Satellite Dossiers",
    purpose: "Detailed technical specifications for orbiting assets.",
    label: "ARCHIVE",
    icon: Database
  },
  {
    name: "ISS / Sky Intelligence",
    purpose: "Atmospheric and space station visibility forecasting.",
    label: "FORECASTING",
    icon: Orbit
  }
];

export function SystemsGrid({ chapter }: { chapter: string }) {
  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
      <ChapterNode chapter={chapter} label="SYSTEMS" />
      
      <div className="md:pl-[12%]">
        <div className="mb-12">
          <h2 className="text-3xl font-light text-white tracking-tight mb-4">Core Systems</h2>
          <p className="text-slate-400 font-light max-w-2xl">
            A modular suite of instruments designed to parse, track, and visualize the sky above any given location on Earth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SYSTEMS.map((sys, idx) => (
            <motion.div 
              key={sys.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="p-6 rounded-xl border border-slate-800/60 bg-[#030712]/50 hover:bg-[#060F22] hover:border-cyan-900/50 transition-colors group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[9px] text-cyan-600 tracking-widest uppercase">{sys.label}</span>
                <sys.icon className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
              
              <h3 className="text-lg font-medium text-slate-200 mb-2 group-hover:text-white transition-colors">{sys.name}</h3>
              <p className="text-sm text-slate-500 font-light leading-relaxed group-hover:text-slate-400 transition-colors">
                {sys.purpose}
              </p>
              
              {/* Subtle corner accent */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b border-r border-cyan-800/0 group-hover:border-cyan-500/30 transition-all rounded-br-lg" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
