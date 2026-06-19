"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  X, MapPin, Globe2, Clock, Cloud, Moon, Eye,
  Satellite, Radio, Telescope, Loader2, Compass,
} from "lucide-react";
import OrbitalGriefGauge from "./OrbitalGriefGauge";

export interface TelemetryData {
  location: string;
  country: string;
  cloudCover: number;
  moonPhase: number;
  visiblePlanets: string[];
  satellitesOverhead: number;
  insight: string;
  skyQualityScore: number;
  orbitalGriefIndex: number;
  timestamps: { weather: number; satellites: number; celestial: number };
}

export interface IssData {
  latitude: number;
  longitude: number;
  updatedAt: number;
  orbitPath?: { lat: number; lon: number }[];
}

interface Props {
  location: { lat: number; lon: number; name: string; country: string } | null;
  telemetry: TelemetryData | null;
  issData: IssData | null;
  issPassTime: number | null;
  loading: boolean;
  onClose: () => void;
}

function getMoonPhaseName(deg: number) {
  const n = deg % 360;
  if (n < 10 || n > 350) return "🌑 New Moon";
  if (n < 80)  return "🌒 Waxing Crescent";
  if (n < 100) return "🌓 First Quarter";
  if (n < 170) return "🌔 Waxing Gibbous";
  if (n < 190) return "🌕 Full Moon";
  if (n < 260) return "🌖 Waning Gibbous";
  if (n < 280) return "🌗 Last Quarter";
  return "🌘 Waning Crescent";
}

interface DataRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  updatedAt?: number;
  refreshLabel?: string;
  accent?: string;
}

const DataRow = ({ icon, label, value, updatedAt, refreshLabel, accent = "#00E5FF" }: DataRowProps) => (
  <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0 group">
    <div className="flex items-center gap-2.5">
      <span style={{ color: accent }} className="opacity-70">{icon}</span>
      <span className="text-xs text-slate-400 font-mono tracking-wider uppercase">{label}</span>
    </div>
    <div className="text-right">
      <div className="text-sm text-white font-semibold">{value}</div>
      {updatedAt && (
        <div className="text-[10px] font-mono text-slate-600 mt-0.5">
          {format(new Date(updatedAt), "HH:mm:ss")}
          {refreshLabel && <span className="ml-1 opacity-50">↻{refreshLabel}</span>}
        </div>
      )}
    </div>
  </div>
);

const LiveDot = () => (
  <span className="relative flex h-2 w-2 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
  </span>
);

export default function IntelligencePanel({ location, telemetry, issData, issPassTime, loading, onClose }: Props) {
  const tz = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  const localTime = location
    ? new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false })
    : null;

  return (
    <div className="h-full w-full bg-[#020d1f]/90 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <LiveDot />
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">
            Celestial Intelligence
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
        <AnimatePresence mode="wait">

          {/* Loading state */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-80 gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-[#00E5FF]/20 border-t-[#00E5FF] animate-spin" />
                <Telescope className="absolute inset-0 m-auto w-6 h-6 text-[#00E5FF]" />
              </div>
              <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
                Scanning celestial data…
              </p>
            </motion.div>
          )}

          {/* Data state */}
          {!loading && telemetry && location && (
            <motion.div
              key="data"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="p-5 space-y-5"
            >
              {/* Location card */}
              <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5 text-[#00E5FF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-white leading-tight truncate">
                      {telemetry.location || "Unknown"}
                    </h2>
                    <p className="text-sm text-slate-400 mt-0.5">{telemetry.country}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "LAT",  value: `${location.lat.toFixed(4)}°` },
                    { label: "LON",  value: `${location.lon.toFixed(4)}°` },
                    { label: "TIME", value: localTime ?? "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-[9px] text-slate-500 font-mono tracking-widest">{label}</p>
                      <p className="text-xs text-white font-mono font-semibold mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orbital Grief Index */}
              <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
                <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} />
              </div>

              {/* Cosmic Insight */}
              <div className="bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span className="text-[10px] font-mono text-[#7C3AED] tracking-widest uppercase">
                    Cosmic Insight
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{telemetry.insight}</p>
              </div>

              {/* Live data rows */}
              <div className="bg-white/4 border border-white/10 rounded-2xl px-4 py-1">
                <DataRow
                  icon={<Cloud className="w-3.5 h-3.5" />}
                  label="Cloud Cover"
                  value={`${telemetry.cloudCover}%`}
                  updatedAt={telemetry.timestamps.weather}
                  refreshLabel="10m"
                />
                <DataRow
                  icon={<Eye className="w-3.5 h-3.5" />}
                  label="Sky Quality"
                  value={`${telemetry.skyQualityScore} / 100`}
                  updatedAt={telemetry.timestamps.weather}
                  refreshLabel="10m"
                />
                <DataRow
                  icon={<Moon className="w-3.5 h-3.5" />}
                  label="Moon Phase"
                  value={getMoonPhaseName(telemetry.moonPhase)}
                  updatedAt={telemetry.timestamps.celestial}
                  refreshLabel="1h"
                  accent="#C084FC"
                />
                <DataRow
                  icon={<Globe2 className="w-3.5 h-3.5" />}
                  label="Visible Planets"
                  value={
                    telemetry.visiblePlanets.length > 0
                      ? telemetry.visiblePlanets.join(", ")
                      : "None above horizon"
                  }
                  updatedAt={telemetry.timestamps.celestial}
                  refreshLabel="1h"
                  accent="#C084FC"
                />
                <DataRow
                  icon={<Satellite className="w-3.5 h-3.5" />}
                  label="Satellites Overhead"
                  value={`${telemetry.satellitesOverhead} tracked`}
                  updatedAt={telemetry.timestamps.satellites}
                  refreshLabel="5m"
                  accent="#34D399"
                />
              </div>

              {/* ISS panel */}
              <div className="bg-gradient-to-br from-red-500/8 to-transparent border border-red-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px] font-mono text-red-400 tracking-widest uppercase">ISS Tracking</span>
                  <LiveDot />
                </div>

                {issData ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "LAT",  value: `${issData.latitude.toFixed(2)}°`  },
                      { label: "LON",  value: `${issData.longitude.toFixed(2)}°` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white/5 rounded-lg p-2.5 text-center">
                        <p className="text-[9px] text-slate-500 font-mono tracking-widest">{label}</p>
                        <p className="text-xs text-white font-mono font-semibold mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Acquiring ISS signal…
                  </div>
                )}

                {issData && (
                  <p className="text-[10px] font-mono text-slate-600">
                    Updated {formatDistanceToNow(new Date(issData.updatedAt))} ago ↻30s
                  </p>
                )}

                {issPassTime && (
                  <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                    <p className="text-[10px] font-mono text-red-400 tracking-widest uppercase mb-1">
                      Next ISS Pass
                    </p>
                    <p className="text-sm text-white font-semibold">
                      {format(new Date(issPassTime), "HH:mm")} local
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(issPassTime), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              {/* Timezone */}
              <div className="bg-white/4 border border-white/10 rounded-2xl px-4 py-1">
                <DataRow
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Timezone"
                  value={tz}
                  accent="#94A3B8"
                />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/3 shrink-0">
        <p className="text-[10px] font-mono text-slate-600 text-center tracking-widest uppercase">
          Powered by CelesTrak · Open-Meteo · Nominatim · Astronomy Engine
        </p>
      </div>
    </div>
  );
}
