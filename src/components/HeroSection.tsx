"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#020617] flex items-center justify-center">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full scale-105" // scale slightly to allow for parallax if needed
        >
          <source src="/video.mp4" type="video/mp4" />
          {/* Fallback gradient if video fails or is loading */}
        </video>
        {/* Dark overlay for text readability - rgba(0,0,0,0.55) */}
        <div className="absolute inset-0 bg-black/55 z-10" />
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-xs font-medium text-[#00E5FF] tracking-wider uppercase">System Online</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          className="text-5xl md:text-7xl lg:text-8xl font-primary font-bold text-white tracking-tight leading-tight mb-8"
        >
          THE SKY <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
            WE LOST
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
          className="max-w-2xl text-xl md:text-2xl text-slate-300 font-primary font-bold leading-relaxed mb-12"
        >
          From the scale of the universe to the sky above you. <br className="hidden md:block" />
          Discover satellites, planets, constellations, and celestial events above any coordinate on Earth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          <Link 
            href="/observatory"
            className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[1px]"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-[#020617] px-8 py-4 rounded-full transition-all duration-300 group-hover:bg-opacity-0">
              <span className="relative z-10 font-primary font-semibold text-white group-hover:text-white transition-colors flex items-center justify-center gap-2">
                Launch Observatory
                <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                  <div className="w-1.5 h-1.5 bg-white rounded-full group-hover:scale-150 transition-transform" />
                </div>
              </span>
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF] to-[#7C3AED] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500" />
          </Link>

          <button className="group flex items-center gap-3 px-8 py-4 rounded-full text-white font-primary font-medium hover:bg-white/5 transition-colors duration-300">
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 group-hover:bg-white/10 group-hover:border-white/40 transition-all">
              <Play fill="currentColor" className="w-4 h-4 ml-0.5 text-slate-200 group-hover:text-white" />
            </div>
            Watch Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}
