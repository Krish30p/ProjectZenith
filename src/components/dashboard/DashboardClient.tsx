"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Compass } from 'lucide-react';
import StatusGrid from './StatusGrid';
import LiveGlobe from './LiveGlobe';

export interface IssData {
  latitude: number;
  longitude: number;
  updatedAt: number; // epoch ms
}

export interface TelemetryData {
  location: string;
  cloudCover: number;
  moonPhase: number;
  visiblePlanets: string[];
  satellitesOverhead: number;
  insight: string;
  skyQualityScore: number;
  timestamps: {
    weather: number;
    satellites: number;
    celestial: number;
    location: number;
  };
}

// Refresh intervals (ms)
const INTERVAL_ISS        = 30_000;   // 30 seconds
const INTERVAL_SATELLITES = 5  * 60_000; // 5 minutes
const INTERVAL_CELESTIAL  = 60 * 60_000; // 1 hour

export default function DashboardClient() {
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [telemetry, setTelemetry]     = useState<TelemetryData | null>(null);
  const [issData, setIssData]         = useState<IssData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Track last fetch times to decide which data needs refreshing
  const lastTelemetryFetch = useRef<number>(0);
  const coordsRef = useRef(coordinates);
  useLayoutEffect(() => { coordsRef.current = coordinates; }, [coordinates]);

  // ── 1. Geolocation ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoordinates({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => {
          console.warn("Geolocation denied or failed. Falling back to Chennai.", err);
          setCoordinates({ lat: 13.0827, lon: 80.2707 });
        },
        { timeout: 10000 }
      );
    } else {
      // No geolocation — set fallback inside a timer callback so setState isn't sync in effect body
      const t = setTimeout(() => setCoordinates({ lat: 13.0827, lon: 80.2707 }), 0);
      return () => clearTimeout(t);
    }
  }, []);

  // ── 2. ISS: refresh every 30 seconds ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    async function doFetch() {
      try {
        const res = await fetch('/api/iss');
        if (!res.ok || !active) return;
        const data = await res.json();
        setIssData({ ...data, updatedAt: Date.now() });
      } catch { /* silent */ }
    }
    void doFetch();
    const id = setInterval(() => void doFetch(), INTERVAL_ISS);
    return () => { active = false; clearInterval(id); };
  }, []);

  // ── 3. Telemetry: smart refresh per data type ────────────────────────────────
  useEffect(() => {
    if (!coordinates) return;
    const { lat, lon } = coordinates;
    let active = true;
    async function doFetch() {
      if (!active) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/telemetry?lat=${lat}&lon=${lon}`);
        if (!res.ok) throw new Error('Failed to fetch telemetry data');
        const data: TelemetryData = await res.json();
        setTelemetry(data);
        lastTelemetryFetch.current = Date.now();
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    void doFetch();
    const id = setInterval(() => void doFetch(), INTERVAL_SATELLITES);
    return () => { active = false; clearInterval(id); };
  }, [coordinates]);

  // ── 4. Force celestial refresh once per hour ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (coordsRef.current) void fetch(
        `/api/telemetry?lat=${coordsRef.current.lat}&lon=${coordsRef.current.lon}`
      ).then(r => r.ok ? r.json() : null).then(d => { if (d) setTelemetry(d); });
    }, INTERVAL_CELESTIAL);
    return () => clearInterval(id);
  }, []);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        <p>Error initializing observatory: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden font-primary">
      {/* Left Panel */}
      <div className="w-full lg:w-1/3 xl:w-[400px] bg-[#020617]/95 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col h-full z-10 overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-xl font-semibold tracking-wider text-slate-300 uppercase mb-2">Zenith Observatory</h1>
          <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">What exists above you right now?</h2>
        </div>

        {/* Location Display */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-8">
          <div className="flex items-center gap-3 text-slate-300 mb-2">
            <MapPin className="w-5 h-5 text-[#00E5FF]" />
            <span className="font-medium">Current Location</span>
          </div>
          {loading && !telemetry ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Detecting coordinates...
            </div>
          ) : (
            <>
              <p className="text-xl text-white font-semibold mb-3">{telemetry?.location || 'Acquiring...'}</p>
              <div className="grid grid-cols-3 gap-4 text-sm font-mono text-slate-400">
                <div>
                  <p className="text-xs text-slate-500">LATITUDE</p>
                  <p>{coordinates?.lat.toFixed(4)}°</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">LONGITUDE</p>
                  <p>{coordinates?.lon.toFixed(4)}°</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">TIMEZONE</p>
                  <p>{Intl.DateTimeFormat().resolvedOptions().timeZone.split('/')[1] || 'LOCAL'}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Cosmic Insight */}
        {telemetry?.insight && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-gradient-to-br from-[#00E5FF]/10 to-transparent border border-[#00E5FF]/20 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2 text-[#00E5FF]">
              <Compass className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wider uppercase">Cosmic Insight</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{telemetry.insight}</p>
          </motion.div>
        )}

        {/* Status Grid */}
        <div className="flex-1">
          {loading && !telemetry ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-4">
              <Loader2 className="w-8 h-8 text-[#00E5FF] animate-spin" />
              <p className="text-sm text-slate-400 font-mono uppercase tracking-widest">Establishing Uplink...</p>
            </div>
          ) : (
            <StatusGrid telemetry={telemetry} issData={issData} />
          )}
        </div>
      </div>

      {/* Right Panel: 3D Globe */}
      <div className="flex-1 relative bg-black">
        {coordinates && (
          <LiveGlobe
            coordinates={coordinates}
            issPosition={issData ? { latitude: issData.latitude, longitude: issData.longitude } : null}
          />
        )}
      </div>
    </div>
  );
}
