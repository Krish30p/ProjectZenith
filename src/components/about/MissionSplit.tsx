"use client";

import { motion } from "framer-motion";
import { ChapterNode } from "./ChapterNode";

export function MissionSplit({ chapter }: { chapter: string }) {
  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16">
      <ChapterNode chapter={chapter} label="CONTEXT" />
      
      <div className="md:pl-[12%]">
        <div className="grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden border border-slate-800/60 bg-[#030712] relative">
          
          {/* Connecting Line between the panels */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-slate-900 via-cyan-900/40 to-slate-900 hidden lg:block z-10" />

          {/* Left Panel: The Problem */}
          <div className="p-10 sm:p-14 lg:p-16 relative bg-[#020617] group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-transparent to-transparent opacity-50" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center mb-8">
                <span className="font-mono text-xs text-slate-500">01</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-light text-slate-300 mb-6 tracking-tight">
                The Sky Became <br className="hidden sm:block" />
                Harder to Read
              </h2>
              
              <div className="space-y-6 text-slate-400 font-light leading-relaxed">
                <p>
                  Today, the sky is more than weather and stars. A massive, invisible infrastructure orbits directly above us.
                </p>
                <p>
                  Yet, orbital telemetry, geospatial context, weather conditions, and celestial visibility remain fragmented across disconnected tools. For the everyday observer or analyst, the sky has become obscured by data silos.
                </p>
                <p>
                  People look up and no longer understand what is flying above them, what systems are active, or how the atmosphere affects their view.
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel: The Response */}
          <div className="p-10 sm:p-14 lg:p-16 relative bg-gradient-to-br from-[#040C1A] to-[#020617] group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent opacity-80" />
            
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full border border-cyan-800/50 bg-cyan-950/30 flex items-center justify-center mb-8">
                <span className="font-mono text-xs text-cyan-400">02</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-light text-white mb-6 tracking-tight">
                Zenith Turns the Sky <br className="hidden sm:block" />
                Into an Experience
              </h2>
              
              <div className="space-y-6 text-slate-300 font-light leading-relaxed">
                <p>
                  Zenith was built to translate this raw telemetry into a spatial, interactive, cinematic interface.
                </p>
                <p>
                  It unifies orbital tracking, weather signals, and planetary context into a single observatory experience. It doesn't just show you numbers; it lets you inspect a living system.
                </p>
                <p className="text-cyan-100">
                  By bringing together these disparate data streams, Zenith makes orbital space legible again—allowing you to read the sky with precision and awe.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
