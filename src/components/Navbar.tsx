"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent ${
        isScrolled
          ? "bg-[#020617]/70 backdrop-blur-md border-white/10 shadow-lg shadow-black/20 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00E5FF] to-[#7C3AED] flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(0,229,255,0.4)]">
                <div className="w-3 h-3 bg-[#020617] rounded-full" />
              </div>
              <span className="font-primary font-bold text-xl tracking-widest text-white">
                ZENITH
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-lg font-primary text-slate-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/observatory" className="text-lg font-primary text-slate-300 hover:text-white transition-colors">
              Observatory
            </Link>
            <Link href="/time-machine" className="text-lg font-primary text-slate-300 hover:text-white transition-colors">
              Cosmic Time Machine
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#020617]/95 backdrop-blur-xl border-b border-white/10"
        >
          <div className="px-4 pt-2 pb-6 space-y-4 shadow-xl">
            <Link href="/features" className="block text-xl font-primary font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md">
              Features
            </Link>
            <Link href="/observatory" className="block text-xl font-primary font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md">
              Observatory
            </Link>
            <Link href="/time-machine" className="block text-xl font-primary font-medium text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md">
              Cosmic Time Machine
            </Link>

          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
