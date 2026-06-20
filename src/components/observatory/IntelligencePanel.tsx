"use client";

import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  X, MapPin, Globe2, Clock, Cloud, Moon, Eye,
  Satellite, Radio, Telescope, Compass, Rocket,
  Navigation, Activity, CheckCircle2, ChevronLeft,
  Target, Route, Info, AlertTriangle, Layers
} from "lucide-react";
import OrbitalGriefGauge from "./OrbitalGriefGauge";
import { LiveSatellite, SatelliteCategory, LayerPayload } from "@/lib/satellites";
import { ConsoleMode } from "./ObservatoryClient";
import { useEffect, useState, useMemo } from "react";

export interface TelemetryData {
  location: string;
  locationNative?: string;
  country: string;
  countryNative?: string;
  cloudCover: number;
  visibilityKm?: number;
  temperature: number;
  orbitalGriefIndex: number;
  insight: string;
  skyQualityScore?: number;
  moonPhase?: number;
  visiblePlanets?: string[];
  satellitesOverhead?: number;
  timezone?: string;
  timezoneAbbr?: string;
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
  location: { lat: number; lon: number; name: string; nameNative?: string; country: string; countryNative?: string } | null;
  telemetry: TelemetryData | null;
  satellite: (LiveSatellite & { source?: string; layerFetchedAt?: number }) | null;
  orbitTrailsEnabled?: boolean;
  loading: boolean;
  onClose: () => void;
  onAction?: (action: 'center' | 'toggle-trail') => void;
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

function getGriefLabel(score: number) {
  if (score < 20) return "Pristine Sky";
  if (score < 40) return "Minor Loss";
  if (score < 60) return "Noticeable Loss";
  if (score < 80) return "Severe Loss";
  return "Sky Crisis";
}

function getSkyQualityLabel(score: number) {
  if (score > 80) return { label: "Excellent", color: "text-emerald-400" };
  if (score > 60) return { label: "Good", color: "text-[#00E5FF]" };
  if (score > 40) return { label: "Moderate", color: "text-amber-400" };
  if (score > 20) return { label: "Poor", color: "text-orange-400" };
  return { label: "Severe Obstruction", color: "text-red-400" };
}

const DataRow = ({ icon, label, value, updatedAt, refreshLabel, accent = "#00E5FF" }: any) => (
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

const DataBox = ({ label, value, accent = "#slate-400" }: any) => (
  <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5 hover:border-white/10 transition-colors">
    <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mb-1">{label}</p>
    <p className="text-sm text-white font-mono font-semibold" style={{ color: accent !== "#slate-400" ? accent : "white" }}>{value}</p>
  </div>
);

const LiveDot = () => (
  <span className="relative flex h-2 w-2">
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
  orbitTrailsEnabled = true,
  loading,
  onClose,
  onAction
}: Props) {
  const tz = telemetry?.timezone || (typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC");

  const tzAbbr = telemetry?.timezoneAbbr || tz;

  const localTime = location
    ? new Date().toLocaleTimeString("en-US", { timeZone: tz, hour12: false })
    : null;

  const [issPass, setIssPass] = useState<{ nextPass: number | null, maxElevationDegrees: number | null } | null>(null);
  const [issPassLoading, setIssPassLoading] = useState(false);

  useEffect(() => {
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
    let regime = "";
    if (satellite.altitudeKm < 2000) regime = "Operating in Low Earth Orbit (LEO). ";
    else if (satellite.altitudeKm > 35000) regime = "Operating in Geosynchronous Orbit (GEO). ";
    else regime = "Operating in Medium Earth Orbit (MEO). ";

    switch(satellite.category) {
      case 'stations': return regime + "A crewed human spaceflight outpost orbiting the Earth.";
      case 'gps': return regime + "A critical node in the global positioning and navigation constellation.";
      case 'weather': return regime + "An Earth-observation satellite providing critical meteorological and climate data.";
      case 'starlink': return regime + "A low Earth orbit broadband internet node in the Starlink megaconstellation.";
      case 'iridium': return regime + "A communications satellite providing global voice and data coverage.";
      default: return regime + "An orbital asset actively tracked by Zenith systems.";
    }
  }, [satellite]);

  const totalTracked = useMemo(() => Object.values(satellitesMap).reduce((sum, payload) => sum + (payload?.satellites?.length || 0), 0), [satellitesMap]);
  const activeCount = useMemo(() => Object.values(activeLayers).filter(Boolean).length, [activeLayers]);
  const stationsPayload = satellitesMap.stations;
  const issData = stationsPayload?.satellites.find(s => s.name.toUpperCase().includes('ISS') || s.name.toUpperCase().includes('CSS'));

  const renderDefaultMode = () => (
    <div className="p-5 space-y-6">
      <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-5">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-[#00E5FF]" />
          Active Location Summary
        </h2>
        {location ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-semibold text-lg">{location.name}</div>
                {location.nameNative && (
                  <div className="text-slate-500 text-xs mt-0.5">{location.nameNative}</div>
                )}
                <div className="text-slate-400 text-sm">
                  {location.country}
                  {location.countryNative && (
                    <span className="text-slate-500 text-xs ml-1.5">({location.countryNative})</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[#00E5FF] font-mono text-lg">{localTime}</div>
                <div className="text-slate-500 text-[10px] font-mono uppercase">{tzAbbr}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <DataBox label="LAT" value={`${location.lat.toFixed(4)}°`} />
               <DataBox label="LON" value={`${location.lon.toFixed(4)}°`} />
            </div>
          </>
        ) : (
          <div className="bg-black/20 rounded-lg p-4 text-center border border-white/5">
            <MapPin className="w-5 h-5 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Location not set. Search or click the globe to begin.</p>
          </div>
        )}
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
          <Moon className="w-3.5 h-3.5 text-[#C084FC]" />
          Current Sky Summary
        </h3>
        {telemetry ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
               <span className="text-slate-400">Moon Phase</span>
               <span className="text-white font-medium">{getMoonPhaseName(telemetry.moonPhase || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
               <span className="text-slate-400">Cloud Cover</span>
               <span className="text-white font-medium">{telemetry.cloudCover}%</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
               <span className="text-slate-400">Sky Quality</span>
               <span className="text-white font-medium">{telemetry.skyQualityScore}/100</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">Orbital Grief</span>
               <span className="text-white font-medium">{telemetry.orbitalGriefIndex}/100</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">Sky telemetry unavailable.</p>
        )}
      </div>

      <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-4">
          <Satellite className="w-3.5 h-3.5 text-[#34D399]" />
          Live Orbital Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
             <span className="text-slate-400">Tracked Objects</span>
             <span className="text-white font-mono">{totalTracked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
             <span className="text-slate-400">Active Layers</span>
             <span className="text-white font-mono">{activeCount} / 5</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
             <span className="text-slate-400">Orbit Trails</span>
             <span className={orbitTrailsEnabled ? "text-emerald-400 font-mono" : "text-slate-500 font-mono"}>
               {orbitTrailsEnabled ? "ENABLED" : "DISABLED"}
             </span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-slate-400">ISS Tracker</span>
             <span className={issData ? "text-[#F59E0B] font-mono" : "text-slate-500 font-mono"}>
               {issData ? "ONLINE" : "OFFLINE"}
             </span>
          </div>
        </div>
      </div>

      {telemetry && (
        <div className="bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="text-[10px] font-mono text-[#7C3AED] tracking-widest uppercase">
              Dynamic AI Insight
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed italic">{telemetry.insight}</p>
        </div>
      )}
    </div>
  );

  const renderLocationMode = () => {
    if (!location || !telemetry) return null;
    const griefLabel = getGriefLabel(telemetry.orbitalGriefIndex);
    const sqLabel = getSkyQualityLabel(telemetry.skyQualityScore || 0);

    return (
      <div className="p-5 space-y-5">
        {/* 1. LOCATION HEADER */}
        <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00E5FF]/5 rounded-full blur-2xl" />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="text-[10px] font-mono text-[#00E5FF] tracking-widest uppercase">
              Active Observatory Target
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white leading-tight truncate">{location.name}</h2>
          {location.nameNative && (
            <p className="text-sm text-slate-500 mt-0.5 font-medium">{location.nameNative}</p>
          )}
          <p className="text-sm text-slate-400 mt-0.5 mb-4">
            {location.country}
            {location.countryNative && (
              <span className="text-slate-500 text-xs ml-1.5">({location.countryNative})</span>
            )}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <DataBox label="LAT" value={`${location.lat.toFixed(4)}°`} />
            <DataBox label="LON" value={`${location.lon.toFixed(4)}°`} />
            <DataBox label="TIME" value={localTime ?? "—"} />
            <DataBox label="TZ" value={tzAbbr} />
          </div>
        </div>

        {/* 2. SKY CONDITIONS */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Cloud className="w-3.5 h-3.5 text-[#C084FC]" /> Sky Conditions
          </h3>
          <div className="space-y-1">
            <DataRow
              icon={<Moon className="w-3.5 h-3.5" />}
              label="Moon Phase"
              value={getMoonPhaseName(telemetry.moonPhase || 0)}
            />
            <DataRow
              icon={<Cloud className="w-3.5 h-3.5" />}
              label="Cloud Cover"
              value={`${telemetry.cloudCover}%`}
            />
            <DataRow
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Visibility"
              value={telemetry.visibilityKm !== undefined ? `${telemetry.visibilityKm} km` : 'Not available'}
            />
          </div>
        </div>

        {/* 3. SKY QUALITY SCORE */}
        {telemetry.skyQualityScore !== undefined && (
          <div className="bg-white/4 border border-white/10 rounded-2xl p-4 relative overflow-hidden">
            <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Eye className="w-3.5 h-3.5" /> Sky Quality Score
            </h3>
            <div className="flex items-end gap-3 mb-3">
              <span className={`text-4xl font-bold font-mono tracking-tighter ${sqLabel.color}`}>{telemetry.skyQualityScore}</span>
              <span className={`text-sm font-bold uppercase tracking-wider mb-1 ${sqLabel.color}`}>{sqLabel.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
              Conditions are currently affected by {telemetry.cloudCover > 50 ? 'heavy cloud cover' : 'atmospheric factors'} and {telemetry.orbitalGriefIndex > 50 ? 'significant' : 'moderate'} orbital traffic.
            </p>
          </div>
        )}

        {/* 4. ORBITAL GRIEF INDEX */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <OrbitalGriefGauge value={telemetry.orbitalGriefIndex} />
          <div className="mt-3 flex justify-center items-center">
             <span className="text-xs font-bold text-white uppercase tracking-wider px-3 py-1 bg-white/5 rounded-full border border-white/10">
               {griefLabel}
             </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
               <span>Satellite Density</span>
               <span className="text-rose-400">High</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
               <span>Cloud Obstruction</span>
               <span className="text-slate-300">{telemetry.cloudCover}%</span>
            </div>
          </div>
        </div>

        {/* 5. WHAT'S ABOVE RIGHT NOW */}
        <div className="bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-[#7C3AED] uppercase tracking-widest flex items-center gap-2 mb-4 font-bold">
            <Telescope className="w-4 h-4" /> What's Above Right Now?
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">Satellites Above Horizon</span>
               <span className="text-white font-mono">{telemetry.satellitesOverhead ?? 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
               <span className="text-slate-400">Visible Planets</span>
               <span className="text-emerald-400 font-mono text-right">{telemetry.visiblePlanets?.length ? telemetry.visiblePlanets.join(", ") : "None"}</span>
            </div>
            <div className="flex justify-between items-start text-sm border-t border-white/5 pt-3">
               <span className="text-slate-400">Next ISS Pass</span>
               <div className="text-right">
                  {issPassLoading ? (
                    <span className="text-amber-500 animate-pulse text-xs">Calculating...</span>
                  ) : issPass?.nextPass ? (
                    <>
                      <div className="text-[#00E5FF] font-mono">{formatDistanceToNow(issPass.nextPass)}</div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-tight">
                        Max Elev: {issPass.maxElevationDegrees}° @ {new Date(issPass.nextPass).toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false })}
                      </div>
                    </>
                  ) : (
                    <span className="text-slate-500 text-xs font-mono">NO PASS IN 24H</span>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* 6. LOCATION INSIGHT */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-sm text-slate-300 leading-relaxed italic">
          {telemetry.insight}
        </div>
      </div>
    );
  };

  const renderSatelliteMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        {/* 1. SATELLITE HEADER */}
        <div className="bg-gradient-to-br from-[#00E5FF]/8 to-transparent border border-[#00E5FF]/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LiveDot />
              <span className="text-[10px] font-mono text-[#00E5FF] tracking-widest uppercase">Live Tracking</span>
            </div>
            <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-white tracking-widest uppercase">
              {satellite.category}
            </div>
          </div>
          <div>
            <div className="text-white font-bold text-2xl leading-tight truncate">{satellite.name}</div>
            <div className="text-slate-400 text-xs font-mono mt-1">NORAD: {satellite.id}</div>
          </div>
        </div>

        {/* 2. LIVE ORBITAL STATE */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5" /> Live Orbital State
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <DataBox label="LATITUDE" value={`${satellite.latitude.toFixed(4)}°`} />
            <DataBox label="LONGITUDE" value={`${satellite.longitude.toFixed(4)}°`} />
            <DataBox label="ALTITUDE" value={`${satellite.altitudeKm.toFixed(1)} km`} accent="#00E5FF" />
            <DataBox label="VELOCITY" value={`${satellite.velocityKms.toFixed(2)} km/s`} accent="#00E5FF" />
            <DataBox label="INCLINATION" value={`${satellite.inclination.toFixed(2)}°`} />
            <DataBox label="TIMESTAMP" value="LIVE UTC" accent="#10B981" />
          </div>
        </div>

        {/* 3. ORBIT HEALTH / FRESHNESS */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5" /> Data Freshness
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-400">Status</span>
              {Date.now() - (satellite.layerFetchedAt || satellite.fetchedAt) > 24 * 60 * 60 * 1000 ? (
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-sm text-xs font-mono">STALE</span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-sm text-xs font-mono">FRESH</span>
              )}
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-400">TLE Epoch</span>
              <span className="text-white font-mono text-xs">{formatDistanceToNow(new Date(satellite.tleEpoch))} ago</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-slate-400">Fetched At</span>
              <span className="text-white font-mono text-xs">{formatDistanceToNow(new Date(satellite.layerFetchedAt || satellite.fetchedAt))} ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Source</span>
              <span className="text-slate-300 text-xs font-mono">{satellite.source === 'live-celestrak' ? 'Live CelesTrak' : 'Local Fallback'}</span>
            </div>
          </div>
        </div>

        {/* 4. ORBIT ACTIONS */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Route className="w-3.5 h-3.5" /> Orbit Actions
          </h3>
          <div className="flex flex-col gap-2">
             <button onClick={() => onAction?.('center')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/20 rounded-lg transition-colors text-xs text-[#00E5FF] font-medium uppercase tracking-wider">
               <Target className="w-4 h-4" /> Center on Satellite
             </button>
             <button onClick={() => onAction?.('toggle-trail')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-white font-medium uppercase tracking-wider">
               <Route className="w-4 h-4" /> {orbitTrailsEnabled ? 'Hide Orbit Trail' : 'Show Orbit Trail'}
             </button>
             {location && (
               <button onClick={onClose} className="mt-2 flex items-center justify-center gap-2 py-2 px-3 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 text-[#c084fc] rounded-lg transition-colors text-xs font-medium">
                 <ChevronLeft className="w-3.5 h-3.5" /> Return to {location.name}
               </button>
            )}
          </div>
        </div>

        {/* 5. SATELLITE INSIGHT */}
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-[#00E5FF] mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed italic">{satelliteInsight}</p>
        </div>
      </div>
    );
  };

  const renderIssMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        {/* 1. ISS HEADER */}
        <div className="bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/30 rounded-2xl p-5 relative overflow-hidden">
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 text-[#F59E0B]/10 rotate-45" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <LiveDot />
            <span className="text-[10px] font-mono text-[#F59E0B] tracking-widest uppercase">Featured Orbital Object</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 relative z-10">Int. Space Station</h2>
          <p className="text-xs text-[#F59E0B]/70 font-mono relative z-10 mb-4">NORAD: {satellite.id} • ZARYA</p>
        </div>

        {/* 2. LIVE ISS STATE */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5" /> Live ISS State
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <DataBox label="ALTITUDE" value={`${satellite.altitudeKm.toFixed(1)} km`} accent="#F59E0B" />
            <DataBox label="VELOCITY" value={`${satellite.velocityKms.toFixed(2)} km/s`} accent="#F59E0B" />
            <DataBox label="LATITUDE" value={`${satellite.latitude.toFixed(4)}°`} />
            <DataBox label="LONGITUDE" value={`${satellite.longitude.toFixed(4)}°`} />
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-white/5">
             <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mb-1">State Time</p>
             <p className="text-sm text-emerald-400 font-mono font-semibold">LIVE UTC</p>
          </div>
        </div>

        {/* 3. ISS ORBIT TRACK */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
            <Route className="w-3.5 h-3.5" /> Orbit Track Controls
          </h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => onAction?.('center')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/20 rounded-lg transition-colors text-xs text-[#F59E0B] font-medium uppercase tracking-wider">
               <Target className="w-4 h-4" /> Lock Camera on ISS
             </button>
             <button onClick={() => onAction?.('toggle-trail')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-xs text-white font-medium uppercase tracking-wider">
               <Route className="w-4 h-4" /> {orbitTrailsEnabled ? 'Hide ISS Ground Track' : 'Show ISS Ground Track'}
             </button>
          </div>
        </div>

        {/* 4. ISS OBSERVATION CONTEXT */}
        {location && (
          <div className="bg-gradient-to-br from-[#7C3AED]/10 to-transparent border border-[#7C3AED]/20 rounded-2xl p-4">
            <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Navigation className="w-3.5 h-3.5 text-[#7C3AED]" /> Target Location Context
            </h3>
            <p className="text-xs text-slate-400 mb-3">Calculating relative to: <strong className="text-white">{location.name}</strong></p>
            {issPassLoading ? (
              <p className="text-xs text-[#00E5FF] animate-pulse font-mono">Calculating pass geometry...</p>
            ) : issPass?.nextPass ? (
              <div className="space-y-3 border-t border-white/5 pt-3">
                 <div className="flex justify-between items-end">
                   <span className="text-sm text-slate-300">Next Pass:</span>
                   <span className="text-emerald-400 font-mono font-bold">{formatDistanceToNow(issPass.nextPass)} from now</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-400 pt-1">
                   <span>Max Elevation: <strong className="text-white">{issPass.maxElevationDegrees}°</strong></span>
                   <span>{new Date(issPass.nextPass).toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} {tzAbbr}</span>
                 </div>
              </div>
            ) : (
              <p className="text-xs text-amber-500/70 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center">No passes overhead within 24 hours.</p>
            )}
            <button onClick={onClose} className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 border border-[#7C3AED]/20 text-[#c084fc] rounded-lg transition-colors text-xs font-medium">
               <ChevronLeft className="w-3.5 h-3.5" /> Return to Location View
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-[#020d1f]/90 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col overflow-hidden shadow-[0_-20px_60px_rgba(0,0,0,0.5)] md:shadow-[-20px_0_60px_rgba(0,0,0,0.5)]">

      {/* LIVE STATUS STRIP */}
      <div className="px-5 py-3 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {consoleMode !== 'default' && (
            <button 
              onClick={onClose}
              className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors mr-1"
            >
              <ChevronLeft className="w-4 h-4 text-slate-400" />
            </button>
          )}
          <LiveDot />
          <span className="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-mono text-slate-500 uppercase">{activeCount} Layers</span>
           <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-mono tracking-widest text-slate-400 uppercase">
             {consoleMode} MODE
           </div>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
