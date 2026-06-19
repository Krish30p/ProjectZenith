"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LocationSearch from "./LocationSearch";
import IntelligencePanel, { TelemetryData, IssData } from "./IntelligencePanel";

// Cesium loads only client-side
const GlobeViewer = dynamic(() => import("./GlobeViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#020617] text-[#00E5FF]">
      <div className="w-16 h-16 border-2 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin mb-5" />
      <p className="font-mono text-xs text-slate-400 tracking-widest uppercase">
        Initializing Cesium Ion Engine…
      </p>
    </div>
  ),
});

interface LocationMeta {
  lat: number;
  lon: number;
  name: string;
  country: string;
}

export default function ObservatoryClient() {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationMeta, setLocationMeta]         = useState<LocationMeta | null>(null);
  const [telemetry, setTelemetry]               = useState<TelemetryData | null>(null);
  const [issData, setIssData]                   = useState<IssData | null>(null);
  const [issPassTime, setIssPassTime]           = useState<number | null>(null);
  const [panelOpen, setPanelOpen]               = useState(false);
  const [loading, setLoading]                   = useState(false);
  const coordsRef = useRef(selectedLocation);
  // Keep ref current without causing re-render during paint
  useLayoutEffect(() => { coordsRef.current = selectedLocation; }, [selectedLocation]);

  // ── ISS: refresh every 30 s ──────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    async function doFetchIss() {
      try {
        const res = await fetch("/api/iss");
        if (!res.ok || !active) return;
        const d = await res.json();
        if (!d.error) setIssData({ ...d, updatedAt: Date.now() });
      } catch { /* silent */ }
    }
    void doFetchIss();
    const id = setInterval(() => void doFetchIss(), 30_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // ── Location selection handler ────────────────────────────────────────────
  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    setPanelOpen(true);
    setLoading(true);
    setTelemetry(null);
    setLocationMeta(null);
    setIssPassTime(null);

    try {
      const [telRes, passRes] = await Promise.all([
        fetch(`/api/telemetry?lat=${lat}&lon=${lon}`),
        fetch(`/api/iss-pass?lat=${lat}&lon=${lon}`),
      ]);

      if (telRes.ok) {
        const tel: TelemetryData = await telRes.json();
        setTelemetry(tel);
        setLocationMeta({ lat, lon, name: tel.location, country: tel.country });
      }

      if (passRes.ok) {
        const pass = await passRes.json();
        if (pass.nextPass) setIssPassTime(pass.nextPass);
      }
    } catch (err) {
      console.error("Location select error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh telemetry every 5 min when a location is selected ────────
  useEffect(() => {
    if (!selectedLocation) return;
    const id = setInterval(() => {
      if (coordsRef.current) handleLocationSelect(coordsRef.current.lat, coordsRef.current.lon);
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, [selectedLocation, handleLocationSelect]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617] font-primary">

      {/* ── Globe (behind everything, shifts left when panel opens) ── */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{ right: panelOpen ? "min(420px, 100vw)" : 0 }}
      >
        <GlobeViewer
          onLocationSelect={handleLocationSelect}
          selectedLocation={selectedLocation}
          issPosition={issData ? { latitude: issData.latitude, longitude: issData.longitude } : null}
          issOrbitPath={issData?.orbitPath ?? null}
        />
      </div>

      {/* ── Top HUD ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 py-4 flex items-center justify-between pointer-events-none">
        {/* Brand */}
        <div className="pointer-events-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="font-mono text-xs text-[#00E5FF] tracking-widest uppercase group-hover:text-white transition-colors">
              ← Zenith
            </span>
          </Link>
        </div>

        {/* Search */}
        <div className="pointer-events-auto">
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>

        {/* Live badge */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* ── Bottom hint (before selection) ───────────────────────────── */}
      <AnimatePresence>
        {!panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none select-none"
          >
            <div className="px-6 py-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
              <p className="text-slate-300 text-xs font-mono tracking-widest uppercase">
                Click anywhere on Earth to receive celestial intelligence
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Intelligence Panel ────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-[420px] z-30"
          >
            <IntelligencePanel
              location={locationMeta}
              telemetry={telemetry}
              issData={issData}
              issPassTime={issPassTime}
              loading={loading}
              onClose={() => setPanelOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
