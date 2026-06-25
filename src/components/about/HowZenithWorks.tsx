"use client";

import { motion } from "framer-motion";
import { ChapterNode } from "./ChapterNode";

const FLOW_MODULES = [
  {
    step: "01",
    title: "Input Signals",
    description: "Raw telemetry and environmental data collection.",
    details: [
      "Geospatial Coordinates",
      "Atmospheric Visibility",
      "Orbital Telemetry",
      "ISS Pass Data"
    ]
  },
  {
    step: "02",
    title: "Intelligence Layer",
    description: "Transformation of raw data into spatial coordinates.",
    details: [
      "Telemetry Parsing",
      "Orbital Mechanics",
      "Geospatial Mapping",
      "Rendering Logic"
    ]
  },
  {
    step: "03",
    title: "Experience Surfaces",
    description: "Visual interfaces where intelligence is deployed.",
    details: [
      "Launch Observatory",
      "Orbital Lens",
      "Cosmic Atlas",
      "Time Machine"
    ]
  },
  {
    step: "04",
    title: "User Outcome",
    description: "The final synthesis delivered to the observer.",
    details: [
      "Local Sky Awareness",
      "Traffic Inspection",
      "Visibility Forecast",
      "Systems Legibility"
    ]
  }
];

export function HowZenithWorks({ chapter }: { chapter: string }) {
  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
      <ChapterNode chapter={chapter} label="ARCHITECTURE" />
      
      <div className="md:pl-[12%]">
        <div className="mb-16">
          <h2 className="text-3xl font-light text-white tracking-tight mb-4">Systems Architecture</h2>
          <p className="text-slate-400 font-light max-w-2xl">
            A blueprint of how Zenith processes raw planetary and orbital signals into a cohesive interactive interface.
          </p>
        </div>

        <div className="relative">
          {/* Horizontal connecting line for desktop */}
          <div className="hidden lg:block absolute top-[28px] left-[10%] right-[10%] h-px bg-cyan-900/30 z-0" />
          
          {/* Vertical connecting line for mobile/tablet */}
          <div className="block lg:hidden absolute top-[28px] bottom-[28px] left-[28px] w-px bg-cyan-900/30 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4 relative z-10">
            {FLOW_MODULES.map((mod, idx) => (
              <motion.div 
                key={mod.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative flex flex-row lg:flex-col items-start gap-6 lg:gap-8"
              >
                {/* Node */}
                <div className="w-14 h-14 shrink-0 rounded-full bg-[#030712] border border-cyan-800/50 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <div className="absolute -top-3 -right-3 font-mono text-[9px] text-cyan-500/70">{mod.step}</div>
                </div>

                {/* Content Card */}
                <div className="flex-1 bg-[#020617] border border-slate-800 p-5 rounded-lg w-full relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                  
                  <h3 className="font-medium text-slate-200 mb-1 text-sm tracking-wide">{mod.title}</h3>
                  <p className="text-xs font-light text-slate-500 mb-4">{mod.description}</p>
                  
                  <ul className="space-y-2">
                    {mod.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-mono text-slate-400">
                        <span className="w-1 h-px bg-cyan-800" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
