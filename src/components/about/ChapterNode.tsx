"use client";

import { motion } from "framer-motion";

export function ChapterNode({ chapter, label }: { chapter: string; label?: string }) {
  return (
    <div className="hidden md:flex absolute left-[8%] top-12 -translate-x-1/2 flex-col items-center z-20">
      <div className="w-3 h-3 rounded-full bg-[#020617] border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)] flex items-center justify-center">
        <div className="w-1 h-1 bg-cyan-400 rounded-full" />
      </div>
      <div className="mt-4 flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] text-cyan-500/80 tracking-widest">{chapter}</span>
        {label && <span className="font-mono text-[9px] text-slate-500 tracking-widest uppercase origin-top rotate-180" style={{ writingMode: 'vertical-rl' }}>{label}</span>}
      </div>
    </div>
  );
}
