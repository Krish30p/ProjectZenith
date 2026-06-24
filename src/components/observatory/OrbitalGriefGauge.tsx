"use client";

import { motion } from "framer-motion";

interface Props {
  value: number; // 0-100
  theme?: "light" | "dark";
}

const CATEGORIES = [
  { max: 20,  label: "Pristine Sky",    color: "#00E5FF", darkBg: "from-[#00E5FF]/20", lightBg: "from-[#00E5FF]/10", textColorDark: "#00E5FF", textColorLight: "#00b2c6" },
  { max: 40,  label: "Minor Loss",      color: "#7FFF00", darkBg: "from-[#7FFF00]/20", lightBg: "from-[#7FFF00]/10", textColorDark: "#7FFF00", textColorLight: "#5da600" },
  { max: 60,  label: "Noticeable Loss", color: "#FFD700", darkBg: "from-[#FFD700]/20", lightBg: "from-[#FFD700]/10", textColorDark: "#FFD700", textColorLight: "#b29600" },
  { max: 80,  label: "Severe Loss",     color: "#FF8C00", darkBg: "from-[#FF8C00]/20", lightBg: "from-[#FF8C00]/10", textColorDark: "#FF8C00", textColorLight: "#cc7000" },
  { max: 101, label: "Sky Crisis",      color: "#FF2D55", darkBg: "from-[#FF2D55]/20", lightBg: "from-[#FF2D55]/10", textColorDark: "#FF2D55", textColorLight: "#cc2444" },
];

function getCategory(v: number) {
  return CATEGORIES.find(c => v < c.max) ?? CATEGORIES[CATEGORIES.length - 1];
}

export default function OrbitalGriefGauge({ value, theme = "dark" }: Props) {
  const cat = getCategory(value);
  const isLight = theme === "light";

  // SVG arc parameters
  const r  = 52;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r; // half circle = PI*r

  // Arc from left to right (180° arc)
  const startAngle = 180;
  const endAngle   = 0;
  const startRad   = (startAngle * Math.PI) / 180;
  const endRad     = (endAngle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const d  = `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;

  return (
    <div className="flex flex-col items-center">
      <p className={`text-[10px] font-mono tracking-widest uppercase mb-3 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
        Orbital Grief Index
      </p>

      <div className="relative w-36 h-20">
        <svg viewBox="0 0 140 80" className="w-full h-full overflow-visible">
          {/* Background track */}
          <path
            d={d}
            fill="none"
            stroke={isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.07)"}
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Animated progress arc */}
          <motion.path
            d={d}
            fill="none"
            stroke={cat.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - ((value / 100) * circumference) }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: isLight ? "none" : `drop-shadow(0 0 6px ${cat.color})` }}
          />

          {/* Centre value */}
          <motion.text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={isLight ? "#1a2b3c" : "white"}
            fontSize="22"
            fontWeight="bold"
            fontFamily="monospace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {value}
          </motion.text>
        </svg>

        {/* Glow blob - reduced opacity in light mode */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl pointer-events-none ${isLight ? 'opacity-5' : 'opacity-20'}`}
          style={{ background: cat.color }}
        />
      </div>

      <motion.div
        key={cat.label}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-1 px-4 py-1 rounded-full bg-gradient-to-r ${isLight ? cat.lightBg : cat.darkBg} to-transparent border ${isLight ? 'border-black/5' : 'border-white/10'}`}
      >
        <span className="text-xs font-semibold font-mono" style={{ color: isLight ? cat.textColorLight : cat.textColorDark }}>
          {cat.label}
        </span>
      </motion.div>
    </div>
  );
}
