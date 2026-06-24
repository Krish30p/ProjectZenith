"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

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
        {/* System Online badge removed */}

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
          className="flex flex-col items-center justify-center"
        >
          {/* Launch Observatory — navigates to full screen app */}
          <Link
            href="/observatory"
            className="group relative w-full sm:w-auto overflow-hidden rounded-full p-[1px] cursor-pointer"
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
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 cursor-pointer group"
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
          });
        }}
      >
        <span className="text-xs font-mono text-slate-400 tracking-widest uppercase group-hover:text-white transition-colors">Scroll to Explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-[#00E5FF] transition-colors" />
        </motion.div>
      </motion.div>
    </section>
  );
}
