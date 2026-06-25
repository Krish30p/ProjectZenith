"use client";

import { motion } from "framer-motion";
import { ChapterNode } from "./ChapterNode";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function ClosingManifesto({ chapter }: { chapter: string }) {
  return (
    <section className="relative w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-24 mb-16">
      <ChapterNode chapter={chapter} label="MANIFESTO" />
      
      <div className="md:pl-[12%]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center md:text-left flex flex-col items-center md:items-start"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight mb-12">
            The sky is no longer <br className="hidden sm:block" />
            <span className="text-cyan-400">just a ceiling.</span>
          </h2>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl mb-16 border-t border-b border-slate-800/50 py-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-mono text-xs text-cyan-500 mb-2">01 / IMMERSIVE</span>
              <p className="text-sm text-slate-400 font-light">Experience orbital data through a cinematic, spatial lens.</p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-mono text-xs text-cyan-500 mb-2">02 / UNIFIED</span>
              <p className="text-sm text-slate-400 font-light">Bring fragmented celestial systems into one cohesive interface.</p>
            </div>
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-mono text-xs text-cyan-500 mb-2">03 / ACTIVE</span>
              <p className="text-sm text-slate-400 font-light">Track the living architecture of space in real-time.</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Link 
              href="/observatory" 
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-cyan-950/40 border border-cyan-500/30 text-cyan-50 hover:bg-cyan-900/40 hover:border-cyan-400/50 transition-all rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-medium tracking-wide text-sm relative z-10">Launch Observatory</span>
            </Link>

            <Link 
              href="/#features" 
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white hover:border-slate-700 transition-all rounded-full"
            >
              <span className="font-medium tracking-wide text-sm">Explore Features</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
