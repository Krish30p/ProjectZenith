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
  isLensActive?: boolean;
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
  if (score > 80) return { label: "Excellent", color: "text-emerald-600" };
  if (score > 60) return { label: "Good", color: "text-teal-700 font-bold" };
  if (score > 40) return { label: "Moderate", color: "text-amber-600" };
  if (score > 20) return { label: "Poor", color: "text-orange-400" };
  return { label: "Severe Obstruction", color: "text-red-400" };
}

const DataRow = ({ icon, label, value, updatedAt, refreshLabel, accent = "#00E5FF" }: any) => (
  <div className="flex items-start justify-between py-3 border-b border-black/5 last:border-0 group">
    <div className="flex items-center gap-2.5">
      <span style={{ color: accent }} className="opacity-70">{icon}</span>
      <span className="text-xs text-slate-700 font-bold font-mono tracking-wider uppercase">{label}</span>
    </div>
    <div className="text-right">
      <div className="text-sm text-slate-900 font-bold font-semibold">{value}</div>
      {updatedAt && (
        <div className="text-[10px] font-mono text-slate-900 font-bold mt-0.5">
          {format(new Date(updatedAt), "HH:mm:ss")}
          {refreshLabel && <span className="ml-1 opacity-50">↻{refreshLabel}</span>}
        </div>
      )}
    </div>
  </div>
);

const DataBox = ({ label, value, accent = "#slate-400" }: any) => (
  <div className="bg-white/60 rounded-xl p-3 text-left border border-black/5 hover:border-black/10 transition-colors shadow-sm">
    <p className="text-[10px] text-slate-700 font-bold font-semibold tracking-widest uppercase mb-1">{label}</p>
    <p className="text-lg text-slate-900 font-bold font-mono font-bold" style={{ color: accent !== "#slate-400" ? accent : "#1e293b" }}>{value}</p>
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
  isLensActive,
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

  // satelliteInsight useMemo removed completely.

  const totalTracked = useMemo(() => Object.values(satellitesMap).reduce((sum, payload) => sum + (payload?.satellites?.length || 0), 0), [satellitesMap]);
  const activeCount = useMemo(() => Object.values(activeLayers).filter(Boolean).length, [activeLayers]);
  const stationsPayload = satellitesMap.stations;
  const issData = stationsPayload?.satellites.find(s => s.name.toUpperCase().includes('ISS') || s.name.toUpperCase().includes('CSS'));

  const renderDefaultMode = () => (
    <div className="p-5 space-y-6">
      <div className="bg-gradient-to-br from-[#0d9488]/8 to-transparent border border-[#0d9488]/20 rounded-2xl p-5">
        <h2 className="text-slate-900 font-bold text-lg mb-4 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-teal-700 font-bold" />
          Active Location Summary
        </h2>
        {location ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-slate-900 font-bold font-semibold text-lg">{location.name}</div>
                {location.nameNative && (
                  <div className="text-slate-700 font-bold text-xs mt-0.5">{location.nameNative}</div>
                )}
                <div className="text-slate-700 font-bold text-sm">
                  {location.country}
                  {location.countryNative && (
                    <span className="text-slate-700 font-bold text-xs ml-1.5">({location.countryNative})</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-teal-700 font-bold font-mono text-lg">{localTime}</div>
                <div className="text-slate-700 font-bold text-[10px] font-mono uppercase">{tzAbbr}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <DataBox label="LAT" value={`${location.lat.toFixed(4)}°`} />
               <DataBox label="LON" value={`${location.lon.toFixed(4)}°`} />
            </div>
          </>
        ) : (
          <div className="bg-white/40 rounded-lg p-4 text-center border border-black/5">
            <MapPin className="w-5 h-5 text-slate-700 font-bold mx-auto mb-2" />
            <p className="text-xs text-slate-700 font-bold">Location not set. Search or click the globe to begin.</p>
          </div>
        )}
      </div>

      <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-5">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-700 font-bold flex items-center gap-2 mb-4">
          <Moon className="w-3.5 h-3.5 text-[#C084FC]" />
          Current Sky Summary
        </h3>
        {telemetry ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
               <span className="text-slate-700 font-bold">Moon Phase</span>
               <span className="text-slate-900 font-bold">{getMoonPhaseName(telemetry.moonPhase || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
               <span className="text-slate-700 font-bold">Cloud Cover</span>
               <span className="text-slate-900 font-bold">{telemetry.cloudCover}%</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
               <span className="text-slate-700 font-bold">Sky Quality</span>
               <span className="text-slate-900 font-bold">{telemetry.skyQualityScore}/100</span>
            </div>
            <div className="flex justify-between items-center text-sm">
               <span className="text-slate-700 font-bold">Orbital Grief</span>
               <span className="text-slate-900 font-bold">{telemetry.orbitalGriefIndex}/100</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-700 font-bold italic">Sky telemetry unavailable.</p>
        )}
      </div>

      <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-5">
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-slate-700 font-bold flex items-center gap-2 mb-4">
          <Satellite className="w-3.5 h-3.5 text-[#34D399]" />
          Live Orbital Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
             <span className="text-slate-700 font-bold">Tracked Objects</span>
             <span className="text-slate-900 font-bold font-mono">{totalTracked.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
             <span className="text-slate-700 font-bold">Active Layers</span>
             <span className="text-slate-900 font-bold font-mono">{activeCount} / 5</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-black/5 pb-2">
             <span className="text-slate-700 font-bold">Orbit Trails</span>
             <span className={orbitTrailsEnabled ? "text-emerald-600 font-mono" : "text-slate-700 font-bold font-mono"}>
               {orbitTrailsEnabled ? "ENABLED" : "DISABLED"}
             </span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-slate-700 font-bold">ISS Tracker</span>
             <span className={issData ? "text-amber-600 font-mono" : "text-slate-700 font-bold font-mono"}>
               {issData ? "ONLINE" : "OFFLINE"}
             </span>
          </div>
        </div>
      </div>

      {telemetry && (
        <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-600/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-mono text-indigo-600 tracking-widest uppercase">
              Dynamic AI Insight
            </span>
          </div>
          <p className="text-sm text-slate-900 font-bold leading-relaxed italic">{telemetry.insight}</p>
        </div>
      )}
    </div>
  );

  const renderDataFreshness = (sat: NonNullable<typeof satellite>) => {
    const epochTime = sat.tleEpoch ? new Date(sat.tleEpoch).getTime() : Date.now();
    const tleAgeHours = (Date.now() - epochTime) / (1000 * 60 * 60);
    let freshBadge = { label: 'FRESH', color: 'text-emerald-600', bg: 'bg-emerald-600/10 border-emerald-600/20' };
    if (tleAgeHours > 72) freshBadge = { label: 'DECAYED', color: 'text-rose-600', bg: 'bg-rose-600/10 border-rose-600/20' };
    else if (tleAgeHours > 48) freshBadge = { label: 'STALE', color: 'text-amber-600', bg: 'bg-amber-600/10 border-amber-600/20' };
    else if (tleAgeHours > 24) freshBadge = { label: 'AGING', color: 'text-blue-600', bg: 'bg-blue-600/10 border-blue-600/20' };

    let sourceLabel = 'Unknown';
    let sourceColor = 'text-slate-700 font-bold';
    if (sat.source === 'live-celestrak') { sourceLabel = 'Live CelesTrak'; sourceColor = 'text-emerald-600'; }
    else if (sat.source === 'cached-celestrak') { sourceLabel = 'Cached Upstream'; sourceColor = 'text-blue-600'; }
    else if (sat.source === 'local-fallback') { sourceLabel = 'Local Fallback'; sourceColor = 'text-amber-600'; }

    const fetchedDate = sat.layerFetchedAt || sat.fetchedAt;
    const fetchedStr = fetchedDate ? `${formatDistanceToNow(new Date(fetchedDate))} ago` : 'Unknown';
    const epochStr = sat.tleEpoch ? `${formatDistanceToNow(new Date(sat.tleEpoch))} ago` : 'Unknown';

    return (
      <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-4">
        <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
          <Layers className="w-3.5 h-3.5" /> Telemetry Quality
        </h3>
        
        <div className="space-y-4">
          {/* Source Truth */}
          <div className="bg-white/40 rounded-xl p-3 border border-black/5">
            <div className="text-[9px] text-slate-700 font-bold font-mono tracking-widest uppercase mb-1">Source Truth</div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-900 font-bold">Origin</span>
              <span className={`text-xs font-mono ${sourceColor}`}>{sourceLabel}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-700 font-bold">Fetched</span>
              <span className="text-slate-900 font-bold font-mono text-xs">{fetchedStr}</span>
            </div>
          </div>

          {/* Orbital Freshness */}
          <div className="bg-white/40 rounded-xl p-3 border border-black/5">
            <div className="text-[9px] text-slate-700 font-bold font-mono tracking-widest uppercase mb-1">Orbital Freshness</div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-900 font-bold">TLE Age Status</span>
              <span className={`px-2 py-0.5 border rounded-sm text-[10px] font-mono tracking-widest uppercase ${freshBadge.bg} ${freshBadge.color}`}>
                {freshBadge.label}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-700 font-bold">Epoch</span>
              <span className="text-slate-900 font-bold font-mono text-xs">{epochStr}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMissionIdentity = (sat: NonNullable<typeof satellite>) => {
    let context = "";
    let role = "";
    
    if (sat.category === 'stations') {
      context = "Human Spaceflight & Orbital Outpost";
      role = "Continuously occupied multi-nation orbital laboratory operating in very Low Earth Orbit (vLEO) for rapid resupply and radiation shielding.";
    } else if (sat.category === 'gps') {
      context = "Global Navigation Constellation (MEO)";
      role = "Semi-synchronous navigation and timing node ensuring consistent planetary signal visibility.";
    } else if (sat.category === 'weather') {
      context = "Meteorological & Earth Observation";
      role = "Climate telemetry and severe weather tracking from optimized orbital regimes.";
    } else if (sat.category === 'starlink') {
      context = "Broadband LEO Mega-Constellation";
      role = "Highly dense, low-latency planetary communications relay network.";
    } else if (sat.category === 'iridium') {
      context = "Satcom Relay Network";
      role = "Global cross-linked voice and data mesh network utilizing inter-satellite laser or RF links.";
    } else {
      context = "Tracked Orbital Asset";
      role = "An active object traversing Earth orbit, actively tracked by Zenith systems.";
    }

    return (
      <div className="bg-gradient-to-br from-[#0d9488]/5 to-transparent border border-[#0d9488]/10 rounded-2xl p-4">
        <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
          <Info className="w-3.5 h-3.5 text-teal-700 font-bold" /> Mission Identity
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-[9px] text-slate-700 font-bold font-mono tracking-widest uppercase mb-0.5">Operational Context</p>
            <p className="text-sm text-slate-900 font-bold">{context}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-700 font-bold font-mono tracking-widest uppercase mb-0.5">Orbital Role</p>
            <p className="text-xs text-slate-900 font-bold leading-relaxed italic">{role}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationMode = () => (
    <div className="p-6 space-y-6">
      {/* LOCATION CONTEXT CARD */}
      <div className="bg-white/50 border border-black/5 rounded-3xl p-5 shadow-sm">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <div className="px-3 py-1 bg-[#60c2ba] rounded-full">
            <span className="text-[10px] font-bold text-white tracking-widest uppercase">Location Context</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-teal-700 font-bold tracking-widest uppercase">Live</span>
            <LiveDot />
          </div>
        </div>

        {/* Location Name & Coords */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-5 h-5 text-teal-700 font-bold" />
            <h2 className="text-xl font-semibold text-slate-900 font-bold">{location?.name || 'Acquiring...'}</h2>
          </div>
          <div className="text-xs text-slate-700 font-bold ml-7 flex items-center gap-2">
            <span>{location?.lat?.toFixed(2)}° N, {location?.lon?.toFixed(2)}° E</span>
            <span>•</span>
            <span>{tzAbbr}</span>
          </div>
        </div>

        {/* 4 Inner Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-white/60 rounded-xl p-3 border border-black/5">
            <p className="text-[9px] text-slate-700 font-bold tracking-widest uppercase mb-1">Cloud Cover</p>
            <p className="text-lg text-slate-900 font-bold">{telemetry?.cloudCover || 0}%</p>
            <p className="text-[10px] text-slate-900 font-bold mt-1">{telemetry?.cloudCover! > 80 ? 'Overcast' : telemetry?.cloudCover! > 40 ? 'Partly Cloudy' : 'Clear'}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 border border-black/5">
            <p className="text-[9px] text-slate-700 font-bold tracking-widest uppercase mb-1">Sky Quality</p>
            <p className="text-lg text-slate-900 font-bold">{telemetry?.skyQualityScore || 0}</p>
            <p className="text-[10px] text-slate-900 font-bold mt-1">{getSkyQualityLabel(telemetry?.skyQualityScore || 0).label}</p>
          </div>
          <div className="bg-white/60 rounded-xl p-3 border border-black/5">
            <p className="text-[9px] text-slate-700 font-bold tracking-widest uppercase mb-1">Visible Planets</p>
            <p className="text-lg text-slate-900 font-bold">{telemetry?.visiblePlanets?.length || 0}</p>
            <div className="flex -space-x-1 mt-1">
              {telemetry?.visiblePlanets?.map((p, i) => (
                <div key={i} className="w-3.5 h-3.5 rounded-full bg-slate-300 border border-white shadow-sm" title={p} />
              ))}
            </div>
          </div>
          <div className="bg-white/60 rounded-xl p-3 border border-black/5">
             <p className="text-[9px] text-slate-700 font-bold tracking-widest uppercase mb-1">Next ISS Pass</p>
             <p className="text-sm text-slate-900 font-bold">{issPass?.nextPass ? formatDistanceToNow(issPass.nextPass, { addSuffix: false }) : '--'}</p>
             <p className="text-[10px] text-slate-900 font-bold mt-1">From Now</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSatelliteMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        {/* 1. SATELLITE HEADER */}
        <div className="bg-gradient-to-br from-[#0d9488]/8 to-transparent border border-[#0d9488]/20 rounded-2xl p-4 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LiveDot />
              <span className="text-[10px] font-mono text-teal-700 font-bold tracking-widest uppercase">Live Tracking</span>
            </div>
            <div className="px-2 py-0.5 bg-white/10 rounded text-[9px] font-mono text-slate-900 font-bold tracking-widest uppercase">
              {satellite.category}
            </div>
          </div>
          <div>
            <div className="text-slate-900 font-bold text-2xl leading-tight truncate">{satellite.name}</div>
            <div className="text-slate-700 font-bold text-xs font-mono mt-1">NORAD: {satellite.id}</div>
          </div>
        </div>

        {/* 2. LIVE ORBITAL STATE */}
        <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
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

        {/* 3. MISSION IDENTITY */}
        {renderMissionIdentity(satellite)}

        {/* 4. ORBIT HEALTH / FRESHNESS */}
        {renderDataFreshness(satellite)}

        {/* 5. ORBIT ACTIONS */}
        <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
            <Route className="w-3.5 h-3.5" /> Orbit Actions
          </h3>
          <div className="flex flex-col gap-2">
             <button onClick={() => onAction?.('center')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0d9488]/10 hover:bg-[#0d9488]/20 border border-[#0d9488]/20 rounded-lg transition-colors text-xs text-teal-700 font-bold uppercase tracking-wider">
               <Target className="w-4 h-4" /> Center on Satellite
             </button>
             <button onClick={() => onAction?.('toggle-trail')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-black/5 rounded-lg transition-colors text-xs text-slate-900 font-bold uppercase tracking-wider">
               <Route className="w-4 h-4" /> {orbitTrailsEnabled ? 'Hide Orbit Trail' : 'Show Orbit Trail'}
             </button>
             {location && (
               <button onClick={onClose} className="mt-2 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-700 rounded-lg transition-colors text-xs font-bold">
                 <ChevronLeft className="w-3.5 h-3.5" /> Return to {location.name}
               </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderIssMode = () => {
    if (!satellite) return null;
    return (
      <div className="p-5 space-y-5">
        {/* 1. ISS HEADER */}
        <div className="bg-gradient-to-br from-amber-600/10 to-transparent border border-amber-600/30 rounded-2xl p-5 relative overflow-hidden">
          <Rocket className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-600/10 rotate-45" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <LiveDot />
            <span className="text-[10px] font-mono text-amber-600 tracking-widest uppercase">Featured Orbital Object</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-bold mb-1 relative z-10">Int. Space Station</h2>
          <p className="text-xs text-amber-600/70 font-mono relative z-10 mb-4">NORAD: {satellite.id} • ZARYA</p>
        </div>

        {/* 2. LIVE ISS STATE */}
        <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5" /> Live ISS State
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <DataBox label="ALTITUDE" value={`${satellite.altitudeKm.toFixed(1)} km`} accent="#F59E0B" />
            <DataBox label="VELOCITY" value={`${satellite.velocityKms.toFixed(2)} km/s`} accent="#F59E0B" />
            <DataBox label="LATITUDE" value={`${satellite.latitude.toFixed(4)}°`} />
            <DataBox label="LONGITUDE" value={`${satellite.longitude.toFixed(4)}°`} />
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center border border-black/5">
             <p className="text-[9px] text-slate-700 font-bold font-mono tracking-widest uppercase mb-1">State Time</p>
             <p className="text-sm text-emerald-600 font-mono font-semibold">LIVE UTC</p>
          </div>
        </div>

        {/* 3. ISS MISSION IDENTITY */}
        {renderMissionIdentity(satellite)}

        {/* 4. ISS ORBIT HEALTH / FRESHNESS */}
        {renderDataFreshness(satellite)}

        {/* 5. ISS ORBIT TRACK */}
        <div className="bg-white/60 shadow-sm border border-black/5 rounded-2xl p-4">
          <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-3">
            <Route className="w-3.5 h-3.5" /> Orbit Track Controls
          </h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => onAction?.('center')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-amber-600/10 hover:bg-amber-600/20 border border-amber-600/20 rounded-lg transition-colors text-xs text-amber-600 font-bold uppercase tracking-wider">
               <Target className="w-4 h-4" /> Lock Camera on ISS
             </button>
             <button onClick={() => onAction?.('toggle-trail')} className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-black/5 rounded-lg transition-colors text-xs text-slate-900 font-bold uppercase tracking-wider">
               <Route className="w-4 h-4" /> {orbitTrailsEnabled ? 'Hide ISS Ground Track' : 'Show ISS Ground Track'}
             </button>
          </div>
        </div>

        {/* 4. ISS OBSERVATION CONTEXT */}
        {location && (
          <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-600/20 rounded-2xl p-4">
            <h3 className="text-[11px] font-mono text-slate-700 font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
              <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Target Location Context
            </h3>
            <p className="text-xs text-slate-700 font-bold mb-3">Calculating relative to: <strong className="text-slate-900 font-bold">{location.name}</strong></p>
            {issPassLoading ? (
              <p className="text-xs text-teal-700 font-bold animate-pulse font-mono">Calculating pass geometry...</p>
            ) : issPass?.nextPass ? (
              <div className="space-y-3 border-t border-black/5 pt-3">
                 <div className="flex justify-between items-end">
                   <span className="text-sm text-slate-900 font-bold">Next Pass:</span>
                   <span className="text-emerald-600 font-mono font-bold">{formatDistanceToNow(issPass.nextPass)} from now</span>
                 </div>
                 <div className="flex justify-between text-xs text-slate-700 font-bold pt-1">
                   <span>Max Elevation: <strong className="text-slate-900 font-bold">{issPass.maxElevationDegrees}°</strong></span>
                   <span>{new Date(issPass.nextPass).toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} {tzAbbr}</span>
                 </div>
              </div>
            ) : (
              <p className="text-xs text-amber-600/70 bg-amber-600/10 p-3 rounded-lg border border-amber-600/20 text-center">No passes overhead within 24 hours.</p>
            )}
            <button onClick={onClose} className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 text-indigo-700 rounded-lg transition-colors text-xs font-bold">
               <ChevronLeft className="w-3.5 h-3.5" /> Return to Location View
            </button>
          </div>
        )}
      </div>
    );
  };

  const [activeLensCard, setActiveLensCard] = useState<number | null>(null);

  const renderLensMode = () => (
    <div className="flex flex-col justify-between gap-6 p-6 h-full pb-12">
      
      {/* Overview Flashcard */}
      <motion.div
        layout
        whileHover={{ scale: 1.02, y: -2 }}
        className="relative flex-1 flex flex-col justify-center group bg-white/80 backdrop-blur-2xl border border-[#0d9488]/30 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(13,148,136,0.15)] cursor-default"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-70" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-teal-700 font-bold" />
            <h3 className="font-mono text-base tracking-widest text-slate-900 font-bold uppercase">Orbital Lens</h3>
          </div>
          <p className="text-base leading-relaxed text-slate-900 font-bold">
            Earth-surface overhead congestion derived from Zenith’s live orbital traffic dataset.
          </p>
        </div>
      </motion.div>

      {/* Representation Flashcard */}
      <motion.div
        layout
        whileHover={{ scale: 1.01, y: -2 }}
        className="flex-1 flex flex-col justify-center bg-white/60 backdrop-blur-md border border-black/5 rounded-2xl p-6 hover:border-white/20 transition-colors shadow-lg cursor-default"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-emerald-600" />
          <h4 className="font-mono text-xs tracking-widest text-emerald-600 uppercase">What this represents</h4>
        </div>
        <p className="text-sm leading-relaxed text-slate-700 font-bold">
          This map visualizes <strong className="text-slate-900 font-bold">satellite density</strong>, not weather or temperature. It shows exactly where Zenith detects the densest concentration of tracked orbital objects currently overhead across the Earth.
        </p>
      </motion.div>

      {/* Color Scale Flashcard */}
      <motion.div
        layout
        whileHover={{ scale: 1.01, y: -2 }}
        className="flex-1 flex flex-col justify-center bg-white/60 backdrop-blur-md border border-black/5 rounded-2xl p-6 hover:border-white/20 transition-colors shadow-lg cursor-default"
      >
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-amber-600" />
          <h4 className="font-mono text-xs tracking-widest text-amber-600 uppercase">Congestion Intensity</h4>
        </div>
        
        {/* Spectral Bar matching Cesium palette */}
        <div className="h-4 w-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.1)] mb-5 relative overflow-hidden">
           <div className="absolute inset-0" style={{
             background: "linear-gradient(to right, rgba(20,0,80,0.9), rgba(0,229,255,1) 40%, rgba(255,229,0,1) 75%, rgba(255,0,0,1) 95%, rgba(255,255,255,1) 100%)"
           }} />
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider text-slate-700 font-bold uppercase">Sparse</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider text-teal-700 font-bold uppercase">Moderate</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider text-yellow-400 uppercase">High</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono tracking-wider text-red-500 uppercase">Severe</span>
          </div>
        </div>
      </motion.div>

      {/* About / Dossier Flashcard */}
      <motion.div
        layout
        onClick={() => setActiveLensCard(activeLensCard === 4 ? null : 4)}
        className="bg-white/60 backdrop-blur-md border border-black/5 rounded-2xl p-6 hover:border-[#0d9488]/40 hover:bg-[#0d9488]/5 transition-all shadow-lg cursor-pointer group shrink-0"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-slate-700 font-bold group-hover:text-teal-700 font-bold transition-colors" />
            <h4 className="font-mono text-xs tracking-widest text-slate-700 font-bold group-hover:text-teal-700 font-bold uppercase transition-colors">About this lens</h4>
          </div>
          <ChevronLeft className={`w-5 h-5 text-slate-700 font-bold group-hover:text-teal-700 font-bold transition-all duration-300 ${activeLensCard === 4 ? '-rotate-90' : ''}`} />
        </div>
        
        <AnimatePresence>
          {activeLensCard === 4 && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 20 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-5 border-t border-black/5 space-y-4">
                <p className="text-xs leading-relaxed text-slate-700 font-bold font-mono">
                  &gt; Generated natively from Zenith's live propagated dataset.
                </p>
                <p className="text-xs leading-relaxed text-slate-700 font-bold font-mono">
                  &gt; Each grid region is colored mathematically by the real-time density of tracking coordinates intersecting the area.
                </p>
                <p className="text-xs leading-relaxed text-slate-700 font-bold font-mono">
                  &gt; Updates incrementally to reflect the constantly shifting orbital shell configurations.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );

  return (
    <div className="h-full w-full bg-[#f4f5f0]/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-black/5 flex flex-col overflow-hidden ">

      {/* LIVE STATUS STRIP */}
      <div className="px-6 py-4 border-b border-black/5 bg-white/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {consoleMode !== 'default' && (
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-black/5 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm text-slate-900 font-bold mr-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <LiveDot />
          <span className="text-[10px] font-bold text-teal-700 font-bold tracking-widest uppercase">
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-slate-700 font-bold tracking-widest uppercase">{activeCount} Layers</span>
           <div className={`px-3 py-1.5 rounded-full border text-[9px] font-bold tracking-widest uppercase transition-colors shadow-sm ${isLensActive ? 'bg-[#0d9488]/10 border-[#0d9488]/30 text-teal-700 font-bold' : 'bg-white border-black/5 text-slate-700 font-bold'}`}>
             {isLensActive ? 'LENS MODE' : `${consoleMode} MODE`}
           </div>
           <button onClick={onClose} className="w-8 h-8 ml-2 rounded-full bg-white border border-black/5 hover:bg-slate-50 flex items-center justify-center transition-colors shadow-sm text-slate-900 font-bold">
             <X className="w-4 h-4" />
           </button>
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
                <div className="w-16 h-16 rounded-full border-2 border-[#0d9488]/20 border-t-[#00E5FF] animate-spin" />
                <Telescope className="absolute inset-0 m-auto w-6 h-6 text-teal-700 font-bold" />
              </div>
              <p className="text-xs font-mono text-slate-700 font-bold tracking-widest uppercase">
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
              {isLensActive ? (
                renderLensMode()
              ) : (
                <>
                  {consoleMode === 'default' && renderDefaultMode()}
                  {consoleMode === 'location' && renderLocationMode()}
                  {consoleMode === 'satellite' && renderSatelliteMode()}
                  {consoleMode === 'iss' && renderIssMode()}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
