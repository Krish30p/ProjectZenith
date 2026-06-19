"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Loader2 } from "lucide-react";

interface Result {
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string; country?: string; state?: string };
}

interface Props {
  onLocationSelect: (lat: number, lon: number) => void;
}

export default function LocationSearch({ onLocationSelect }: Props) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const inputRef              = useRef<HTMLInputElement>(null);

  // Whether to show results: query must be long enough
  const shouldSearch = query.trim().length >= 2;

  useEffect(() => {
    if (!shouldSearch) {
      // Clear via timeout callback so setState is not synchronous in effect body
      const t = setTimeout(() => { setResults([]); setOpen(false); }, 0);
      return () => clearTimeout(t);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1`,
          { headers: { "User-Agent": "Zenith Observatory App/1.0" } }
        );
        const data: Result[] = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query, shouldSearch]);

  const handleSelect = (r: Result) => {
    onLocationSelect(parseFloat(r.lat), parseFloat(r.lon));
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative w-72">
      <div className="flex items-center gap-2 bg-white/8 backdrop-blur-xl border border-white/15 rounded-full px-4 py-2.5 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
        {loading
          ? <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />
        }
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search any location..."
          className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full font-primary"
        />
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 4,  scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-[#0a1628]/95 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50"
          >
            {results.map((r, i) => {
              const city    = r.address?.city || r.address?.state || r.display_name.split(",")[0];
              const country = r.address?.country ?? "";
              return (
                <button
                  key={i}
                  onMouseDown={() => handleSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left group"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{city}</p>
                    <p className="text-xs text-slate-500 truncate">{country}</p>
                  </div>
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-[10px] font-mono text-slate-600">{parseFloat(r.lat).toFixed(2)}°</p>
                    <p className="text-[10px] font-mono text-slate-600">{parseFloat(r.lon).toFixed(2)}°</p>
                  </div>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
