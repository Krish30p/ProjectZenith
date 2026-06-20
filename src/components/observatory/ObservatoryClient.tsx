"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LocationSearch from "./LocationSearch";
import IntelligencePanel from "./IntelligencePanel";
export type ConsoleMode = 'default' | 'location' | 'satellite' | 'iss';
import { TelemetryData } from "./IntelligencePanel";
import LayerManager from "./LayerManager";
import { SatelliteCategory, TleData, LiveSatellite, LayerPayload } from "@/lib/satellites";
import * as satellite from "satellite.js";

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
  const [loading, setLoading]                   = useState(false);

  // Satellite State
  const [activeLayers, setActiveLayers] = useState<Record<SatelliteCategory, boolean>>({
    stations: true,
    gps: true,
    weather: true,
    starlink: false,
    iridium: false,
  });
  
  const [satellitesMap, setSatellitesMap] = useState<Record<SatelliteCategory, LayerPayload | null>>({
    stations: null, gps: null, weather: null, starlink: null, iridium: null
  });

  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string | null>(null);
  const [liveSelectedSatellite, setLiveSelectedSatellite] = useState<(LiveSatellite & { source?: string; layerFetchedAt?: number }) | null>(null);
  const [consoleMode, setConsoleMode] = useState<ConsoleMode>('default');

  const coordsRef = useRef(selectedLocation);
  useLayoutEffect(() => { coordsRef.current = selectedLocation; }, [selectedLocation]);

  // Fetch TLEs when a layer is enabled or periodically
  useEffect(() => {
    let active = true;

    async function fetchLayer(category: SatelliteCategory) {
      if (!activeLayers[category]) return;
      try {
        const res = await fetch(`/api/satellites/${category}`);
        if (!res.ok || !active) return;
        const data: LayerPayload = await res.json();
        setSatellitesMap(prev => ({ ...prev, [category]: data }));
      } catch (err) {
        console.error(`Failed to fetch layer ${category}`, err);
      }
    }

    // Fetch newly enabled layers
    (Object.keys(activeLayers) as SatelliteCategory[]).forEach(cat => {
      if (activeLayers[cat] && !satellitesMap[cat]) {
        fetchLayer(cat);
      }
    });

    // Refresh every hour for long-lived sessions
    const interval = setInterval(() => {
      (Object.keys(activeLayers) as SatelliteCategory[]).forEach(cat => {
        if (activeLayers[cat]) fetchLayer(cat);
      });
    }, 60 * 60_000);

    return () => { active = false; clearInterval(interval); };
  }, [activeLayers]); // Intentionally omitting satellitesMap from dependency to avoid loop

  // Toggle Layer
  const handleToggleLayer = (category: SatelliteCategory) => {
    setActiveLayers(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Location select handler
  const handleLocationSelect = useCallback(async (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    // "clicking Earth / searching a place sets selectedLocation and switches to location"
    setConsoleMode('location');
    setLoading(true);

    try {
      const telRes = await fetch(`/api/telemetry?lat=${lat}&lon=${lon}`);
      if (telRes.ok) {
        const tel: TelemetryData = await telRes.json();
        setTelemetry(tel);
        setLocationMeta({ lat, lon, name: tel.location, country: tel.country });
      }
    } catch (err) {
      console.error("Location select error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh telemetry every 5 min when a location is selected
  useEffect(() => {
    if (!selectedLocation) return;
    const id = setInterval(() => {
      if (coordsRef.current) handleLocationSelect(coordsRef.current.lat, coordsRef.current.lon);
    }, 5 * 60_000);
    return () => clearInterval(id);
  }, [selectedLocation, handleLocationSelect]);

  // Satellite select handler
  const handleSatelliteSelect = useCallback((id: string) => {
    setSelectedSatelliteId(id);
    
    // Determine if ISS
    let isIss = false;
    for (const cat of Object.keys(satellitesMap) as SatelliteCategory[]) {
      const payload = satellitesMap[cat];
      if (payload && payload.satellites) {
        const found = payload.satellites.find(s => s.id === id);
        if (found && found.category === 'stations') {
          const upper = found.name.toUpperCase();
          if (upper.includes('ISS') || upper.includes('CSS')) {
            isIss = true;
          }
        }
      }
    }
    
    setConsoleMode(isIss ? 'iss' : 'satellite');
    // We intentionally keep selectedLocation, telemetry, and locationMeta intact
  }, [satellitesMap]);

  // Console Clear / Close handler
  const handleClearSelection = useCallback(() => {
    if (consoleMode === 'satellite' || consoleMode === 'iss') {
      setSelectedSatelliteId(null);
      setLiveSelectedSatellite(null);
      if (selectedLocation) {
        setConsoleMode('location');
      } else {
        setConsoleMode('default');
      }
    } else if (consoleMode === 'location') {
      setSelectedLocation(null);
      setLocationMeta(null);
      setTelemetry(null);
      setConsoleMode('default');
    }
  }, [consoleMode, selectedLocation]);

  // Compute live properties for the selected satellite every 1 second
  useEffect(() => {
    if (!selectedSatelliteId || (consoleMode !== 'satellite' && consoleMode !== 'iss')) return;

    // Find the raw TLE
    let rawTle: TleData | null = null;
    let sourceMeta: { source: string; fetchedAt: number } | null = null;
    
    for (const cat of Object.keys(satellitesMap) as SatelliteCategory[]) {
      const payload = satellitesMap[cat];
      if (payload && payload.satellites) {
        const found = payload.satellites.find(s => s.id === selectedSatelliteId);
        if (found) {
          rawTle = found;
          sourceMeta = { source: payload.source, fetchedAt: payload.fetchedAt };
          break;
        }
      }
    }

    if (!rawTle) return;

    const satrec = satellite.twoline2satrec(rawTle.tleLine1, rawTle.tleLine2);

    const updateLiveSat = () => {
      const now = new Date();
      const posVel = satellite.propagate(satrec, now);
      if (typeof posVel.position === 'boolean') return;
      
      const gmst = satellite.gstime(now);
      const geo = satellite.eciToGeodetic(posVel.position, gmst);
      
      const vel = posVel.velocity as any;
      const velocityKms = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);

      setLiveSelectedSatellite({
        ...rawTle!,
        latitude: satellite.radiansToDegrees(geo.latitude),
        longitude: satellite.radiansToDegrees(geo.longitude),
        altitudeKm: geo.height,
        velocityKms: velocityKms,
        inclination: satellite.radiansToDegrees((satrec.inclo as number) || 0),
        source: sourceMeta?.source,
        layerFetchedAt: sourceMeta?.fetchedAt,
      });
    };

    updateLiveSat();
    const interval = setInterval(updateLiveSat, 1000);
    return () => clearInterval(interval);
  }, [selectedSatelliteId, consoleMode, satellitesMap]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617] font-primary">
      {/* Globe */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{ right: "min(420px, 100vw)" }}
      >
        <GlobeViewer
          satellitesMap={satellitesMap}
          activeLayers={activeLayers}
          selectedSatelliteId={selectedSatelliteId}
          onLocationSelect={handleLocationSelect}
          onSatelliteSelect={handleSatelliteSelect}
          selectedLocation={selectedLocation}
        />
      </div>

      {/* Layer Manager */}
      <LayerManager layers={activeLayers} onToggleLayer={handleToggleLayer} />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 z-20 px-5 py-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span className="font-mono text-xs text-[#00E5FF] tracking-widest uppercase group-hover:text-white transition-colors">
              ← Zenith
            </span>
          </Link>
        </div>
        <div className="pointer-events-auto">
          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Intelligence Panel */}
      <div
        className="absolute top-0 right-0 h-full w-full max-w-[420px] z-40"
      >
        <IntelligencePanel
          consoleMode={consoleMode}
          activeLayers={activeLayers}
          satellitesMap={satellitesMap}
          location={locationMeta}
          telemetry={telemetry}
          satellite={liveSelectedSatellite}
          loading={loading}
          onClose={handleClearSelection}
        />
      </div>
    </div>
  );
}
