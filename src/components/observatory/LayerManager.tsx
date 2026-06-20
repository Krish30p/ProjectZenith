"use client";

import { SatelliteCategory } from "@/lib/satellites";
import { Layers } from "lucide-react";

interface LayerManagerProps {
  layers: Record<SatelliteCategory, boolean>;
  onToggleLayer: (category: SatelliteCategory) => void;
}

export default function LayerManager({ layers, onToggleLayer }: LayerManagerProps) {
  const categories: { key: SatelliteCategory; label: string; color: string }[] = [
    { key: "stations", label: "Stations / ISS", color: "#FF4444" },
    { key: "gps", label: "GPS / Navigation", color: "#3B82F6" },
    { key: "weather", label: "Weather", color: "#10B981" },
    { key: "starlink", label: "Starlink", color: "#00E5FF" },
    { key: "iridium", label: "Iridium Comms", color: "#8B5CF6" },
  ];

  return (
    <div className="absolute left-5 bottom-10 z-20 w-64 bg-[#020d1f]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center gap-2">
        <Layers className="w-4 h-4 text-slate-300" />
        <span className="text-xs font-mono text-slate-300 tracking-widest uppercase">Layer Manager</span>
      </div>
      <div className="p-2 space-y-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onToggleLayer(cat.key)}
            className={`w-full px-3 py-2.5 flex items-center justify-between rounded-xl transition-all duration-300 ${layers[cat.key]
                ? "bg-white/10 hover:bg-white/15"
                : "hover:bg-white/5 opacity-60 hover:opacity-100"
              }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full transition-all duration-300 ${layers[cat.key] ? 'shadow-[0_0_8px_currentColor]' : ''}`}
                style={{
                  color: cat.color,
                  backgroundColor: layers[cat.key] ? cat.color : "transparent",
                  border: `1px solid ${cat.color}`
                }}
              />
              <span className="text-sm text-white font-medium">{cat.label}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${layers[cat.key] ? 'bg-[#00E5FF]/30' : 'bg-white/10'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300 ${layers[cat.key] ? 'translate-x-4 shadow-[0_0_10px_#00E5FF]' : 'translate-x-0'}`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
