"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  X, MapPin, Globe2, Clock, Cloud, Moon, Eye,
  Satellite, Radio, Telescope, Compass, Rocket,
  Navigation, Activity, CheckCircle2, ChevronLeft, Target, Route, Info
} from "lucide-react";
import OrbitalGriefGauge from "./OrbitalGriefGauge";
import { LiveSatellite, SatelliteCategory, LayerPayload } from "@/lib/satellites";
import { ConsoleMode } from "./ObservatoryClient";
import { useEffect, useState, useMemo } from "react";

export interface TelemetryData {
  location: string;
  country: string;
  cloudCover: number;
  visibilityKm: number;
  temperature: number;
  orbitalGriefIndex: number;
  insight: string;
  skyQualityScore?: number;
  moonPhase?: number;
  visiblePlanets?: string[];
  satellitesOverhead?: number;
  timestamps: {
    weather: number;
    grief: number;
    celestial?: number;
    satellites?: number;
  };
}

interface Props {
  consoleMode: ConsoleMode;
  activeLayers: Record<SatelliteCategory, boolean>;
  satellitesMap: Record<SatelliteCategory, LayerPayload | null>;
  location: { lat: number; lon: number; name: string; country: string } | null;
  telemetry: TelemetryData | null;
  satellite: (LiveSatellite & { source?: string; layerFetchedAt?: number }) | null;
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

const DataBox = ({ label, value, accent = "#slate-400" }: { label: string, value: string, accent?: string }) => (
  <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
    <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mb-1">{label}</p>
    <p className="text-sm text-white font-mono font-semibold" style={{ color: accent !== "#slate-400" ? accent : "white" }}>{value}</p>
  </div>
);

const LiveDot = () => (
  <span className="relative flex h-2 w-2 mr-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
  </span>
);

export default function IntelligencePanel({
  consoleMode,
  activeLayers,
  satellitesMap,
  location,
  telemetry,
  satellite,
  loading,
  onClose
}: Props) {
  const tz = typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  const localTime = location
    ? new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false })
    : null;

  const [issPass, setIssPass] = useState<{ nextPass: number | null, maxElevationDegrees: number | null } | null>(null);
  const [issPassLoading, setIssPassLoading] = useState(false);

  useEffect(() => {
    // Fetch ISS pass for BOTH ISS Mode and Location Mode
    if ((consoleMode === 'iss' || consoleMode === 'location') && location) {
      setIssPassLoading(true);
      fetch(`/api/iss-pass?lat=${location.lat}&lon=${location.lon}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setIssPass(data);
        })
        .catch(console.error)
        .finally(() => setIssPassLoading(false));
    } else {
      setIssPass(null);
    }
  }, [consoleMode, location]);

  const satelliteInsight = useMemo(() => {
    if (!satellite) return "";
    switch(satellite.category) {
      case 'stations': return "A crewed human spaceflight outpost orbiting in low Earth orbit.";
      case 'gps': return "A critical node in the global positioning and navigation constellation.";
      case 'weather': return "An Earth-observation satellite providing critical meteorological and climate data.";
      case 'starlink': return "A low Earth orbit broadband internet node in the Starlink megaconstellation.";
      case 'iridium': return "A communications satellite providing global voice and data coverage.";
      default: return "An orbital asset actively tracked by Zenith systems.";
    }
  }, [satellite?.category]);

  const renderDataSourceInfo = () => {
    if (!satellite) return null;
    return (
      <div className="pt-3 border-t border-white/10 space-y-2 mt-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Data Source</span>
          {satellite.source && (
            <div className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider border ${
              satellite.source === 'live-celestrak' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : satellite.source === 'cached-celestrak'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {satellite.source === 'live-celestrak' ? 'Live CelesTrak' : 
               satellite.source === 'cached-celestrak' ? 'Cached Upstream' : 
               'Local Degraded Mode'}
            </div>
          )}
        </div>
        <p className="text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>Freshness:</span>
          <span className="text-slate-300">
            {formatDistanceToNow(new Date(satellite.layerFetchedAt || satellite.fetchedAt))} ago
          </span>
        </p>
        <p className="text-[10px] font-mono text-slate-500 flex justify-between">
          <span>TLE Epoch:</span>
          <span>{formatDistanceToNow(new Date(satellite.tleEpoch))} ago</span>
        </p>
      </div>
    );
  };

  const renderDefaultMode = () => {
    const totalTracked = Object.values(satellitesMap).reduce((sum, payload) => sum + (payload?.satellites?.length || 0), 0);
    const activeCount = Object.values(activeLayers).filter(Boolean).length;
    
    // Find ISS in the stations layer for a live summary
    const stationsPayload = satellitesMap.stations;
    const issData = stationsPayload?.satellites.find(s => s.name.toUpperCase().includes('ISS') || s.name.toUpperCase().includes('CSS'));

    return (
      <div className="p-5 space-y-6">
        <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-5">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#00E5FF]" />
            Observatory Status
          </h2>
          <div className="grid grid-cols-2 gap-3">
             <DataBox label="Active Layers" value={activeCount.toString()} />
             <DataBox label="Objects Tracked" value={totalTracked.toLocaleString()} />
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            SYSTEM ONLINE · {new Date().toISOString().substring(11, 19)} UTC
          </div>
        </div>
        
        {location && telemetry ? (
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
              <MapPin className="w-3.5 h-3.5 text-[#7C3AED]" />
              Target Location
            </h3>
            <div className="text-white font-semibold mb-3 truncate">{location.name}</div>
            <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} />
            <p className="mt-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
              {telemetry.insight}
            </p>
          </div>
        ) : (
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5 text-center">
            <MapPin className="w-6 h-6 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Select a location on Earth to enable localized orbital intelligence.</p>
          </div>
        )}

        {issData && (
          <div className="bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/20 rounded-2xl p-5 relative overflow-hidden">
            <Rocket className="absolute -right-4 -bottom-4 w-20 h-20 text-[#F59E0B]/10 rotate-45" />
            <h3 className="text-[11px] font-mono uppercase tracking-widest text-[#F59E0B] flex items-center gap-2 mb-2">
              Human Spaceflight
            </h3>
            <p className="text-sm font-bold text-white">Int. Space Station</p>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Live tracking active via {stationsPayload?.source === 'local-fallback' ? 'fallback' : 'CelesTrak'}</p>
          </div>
        )}
      </div>
    );
  };

  const renderLocationMode = () => {
    if (!location || !telemetry) return null;
    return (
      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4.5 h-4.5 text-[#00E5FF]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white leading-tight truncate">
                {telemetry.location || location.name}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">{telemetry.country || location.country}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <DataBox label="LAT" value={`${location.lat.toFixed(4)}°`} />
            <DataBox label="LON" value={`${location.lon.toFixed(4)}°`} />
            <DataBox label="TIME" value={localTime ?? "—"} />
          </div>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} />
        </div>

        <div className="bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Telescope className="w-4 h-4 text-[#7C3AED]" />
            <span className="text-[11px] font-mono text-[#7C3AED] tracking-widest uppercase font-bold">
              What's Above Right Now?
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">Total Tracked Overhead:</span>
               <span className="text-white font-mono">{telemetry.satellitesOverhead ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
               <span className="text-slate-400">Visible Planets:</span>
               <span className="text-emerald-400 font-mono text-right">{telemetry.visiblePlanets?.length ? telemetry.visiblePlanets.join(", ") : "None"}</span>
            </div>
            <div className="flex justify-between items-start text-sm border-t border-white/5 pt-3">
               <span className="text-slate-400">Next ISS Pass:</span>
               <div className="text-right">
                  {issPassLoading ? (
                    <span className="text-amber-500 animate-pulse text-xs">Calculating...</span>
                  ) : issPass?.nextPass ? (
                    <>
                      <div className="text-[#00E5FF] font-mono">{formatDistanceToNow(issPass.nextPass)} from now</div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-[150px] leading-tight">
                        Max elev: {issPass.maxElevationDegrees}°. Look up at {format(issPass.nextPass, "HH:mm")}.
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs">No passes in 24h</span>
                  )}
               </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-black/20 rounded-lg text-xs text-slate-300 leading-relaxed italic border border-white/5">
            {telemetry.insight}
          </div>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl px-4 py-1">
          <DataRow
            icon={<Cloud className="w-3.5 h-3.5" />}
            label="Cloud Cover"
            value={`${telemetry.cloudCover}%`}
            updatedAt={telemetry.timestamps.weather}
            refreshLabel="10m"
          />
          {telemetry.skyQualityScore !== undefined && (
            <DataRow
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Sky Quality"
              value={`${telemetry.skyQualityScore} / 100`}
              updatedAt={telemetry.timestamps.weather}
              refreshLabel="10m"
            />
          )}
          {telemetry.moonPhase !== undefined && (
            <DataRow
              icon={<Moon className="w-3.5 h-3.5" />}
              label="Moon Phase"
              value={getMoonPhaseName(telemetry.moonPhase)}
              updatedAt={telemetry.timestamps.celestial}
              refreshLabel="1h"
              accent="#C084FC"
            />
          )}
          {telemetry.visiblePlanets !== undefined && (
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
          )}
          {telemetry.satellitesOverhead !== undefined && (
            <DataRow
              icon={<Satellite className="w-3.5 h-3.5" />}
              label="Sats Overhead"
              value={`${telemetry.satellitesOverhead} tracked`}
              updatedAt={telemetry.timestamps.satellites}
              refreshLabel="5m"
              accent="#34D399"
            />
          )}
        </div>
      </div>
    );
  };

  const renderSatelliteMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="text-[10px] font-mono text-[#00E5FF] tracking-widest uppercase">Orbital Target Lock</span>
            <LiveDot />
          </div>
          
          <div>
            <div className="text-white font-bold text-xl leading-tight truncate flex justify-between items-center">
              {satellite.name}
              {satellite.source === 'live-celestrak' && <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />}
            </div>
            <div className="text-slate-400 text-xs font-mono mt-1">NORAD: {satellite.id} • {satellite.category.toUpperCase()}</div>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/5 mt-3">
            <p className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#00E5FF] mt-0.5 shrink-0" />
              {satelliteInsight}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <DataBox label="LAT" value={`${satellite.latitude.toFixed(4)}°`} />
            <DataBox label="LON" value={`${satellite.longitude.toFixed(4)}°`} />
            <DataBox label="ALT" value={`${satellite.altitudeKm.toFixed(1)} km`} accent="#00E5FF" />
            <DataBox label="VEL" value={`${satellite.velocityKms.toFixed(2)} km/s`} accent="#00E5FF" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                <p className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">Inclination</p>
                <p className="text-sm text-white font-semibold">{satellite.inclination.toFixed(2)}°</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
                <p className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">State Time</p>
                <p className="text-xs text-white font-mono mt-1">Live UTC</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-white/10">
            <p className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mb-1">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
               <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-white font-medium">
                 <Target className="w-3.5 h-3.5" /> Center View
               </button>
               <button className="flex items-center justify-center gap-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-white font-medium">
                 <Route className="w-3.5 h-3.5" /> Toggle Orbit
               </button>
            </div>
            {location && (
               <button onClick={onClose} className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 text-[#c084fc] rounded-lg transition-colors text-xs font-medium">
                 <ChevronLeft className="w-3.5 h-3.5" /> Return to {location.name}
               </button>
            )}
          </div>
          
          {renderDataSourceInfo()}
        </div>
      </div>
    );
  };

  const renderIssMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        <div className="bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/30 rounded-2xl p-5 relative overflow-hidden">
          <Rocket className="absolute -right-4 -bottom-4 w-24 h-24 text-[#F59E0B]/10 rotate-45" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <span className="w-2 h-2 bg-[#F59E0B] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-[#F59E0B] tracking-widest uppercase">Human Spaceflight Outpost</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 relative z-10">{satellite.name}</h2>
          <p className="text-xs text-[#F59E0B]/70 font-mono relative z-10">NORAD: {satellite.id} • ZARYA</p>
          
          <div className="grid grid-cols-2 gap-3 mt-5 relative z-10">
            <DataBox label="ALTITUDE" value={`${satellite.altitudeKm.toFixed(1)} km`} accent="#F59E0B" />
            <DataBox label="VELOCITY" value={`${satellite.velocityKms.toFixed(2)} km/s`} accent="#F59E0B" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3 relative z-10">
            <DataBox label="LAT" value={`${satellite.latitude.toFixed(4)}°`} />
            <DataBox label="LON" value={`${satellite.longitude.toFixed(4)}°`} />
          </div>
          
          <div className="relative z-10">
            {renderDataSourceInfo()}
          </div>
        </div>

        <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Navigation className="w-3.5 h-3.5" /> Next Overhead Pass
          </h3>
          {!location ? (
            <p className="text-xs text-slate-500 italic bg-black/20 p-3 rounded-lg">Select a location on Earth to calculate visibility and pass predictions.</p>
          ) : issPassLoading ? (
            <p className="text-xs text-[#00E5FF] animate-pulse">Calculating orbital mechanics for {location.name}...</p>
          ) : issPass?.nextPass ? (
            <div className="space-y-3">
               <div className="flex justify-between items-end border-b border-white/5 pb-3">
                 <span className="text-sm text-slate-300">Over {location.name}</span>
                 <span className="text-emerald-400 font-mono font-bold text-sm">{formatDistanceToNow(issPass.nextPass)} from now</span>
               </div>
               <div className="flex justify-between text-xs text-slate-400 pt-1">
                 <span>Max Elevation: <strong className="text-white">{issPass.maxElevationDegrees}°</strong></span>
                 <span>{format(issPass.nextPass, "HH:mm:ss a")}</span>
               </div>
            </div>
          ) : (
            <p className="text-xs text-amber-500/70 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">No visible passes in the next 24 hours for {location.name}.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-[#020d1f]/90 backdrop-blur-2xl border-l border-white/10 flex flex-col overflow-hidden shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {consoleMode !== 'default' && (
            <button 
              onClick={onClose}
              className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors mr-1"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
          {consoleMode === 'default' && <Activity className="w-4 h-4 text-[#00E5FF]" />}
          <span className="text-xs font-mono text-slate-400 tracking-widest uppercase">
            Mission Console
          </span>
        </div>
        <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono tracking-widest text-slate-500 uppercase">
          {consoleMode}
        </div>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
        <AnimatePresence mode="wait">
          {loading ? (
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
          ) : (
            <motion.div
              key={consoleMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {consoleMode === 'default' && renderDefaultMode()}
              {consoleMode === 'location' && renderLocationMode()}
              {consoleMode === 'satellite' && renderSatelliteMode()}
              {consoleMode === 'iss' && renderIssMode()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
