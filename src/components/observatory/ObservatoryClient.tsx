"use client";

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Radio, Crosshair, Aperture, Sparkles, Cloud } from "lucide-react";
import Link from "next/link";
import LocationSearch from "./LocationSearch";
import IntelligencePanel from "./IntelligencePanel";
export type ConsoleMode = 'default' | 'location' | 'satellite' | 'iss';
import { TelemetryData } from "./IntelligencePanel";
import LayerManager from "./LayerManager";
import { SatelliteCategory, TleData, LiveSatellite, LayerPayload } from "@/lib/satellites";
import * as satellite from "satellite.js";
import { CosmicBookOverlay } from "./CosmicBookOverlay";


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
  nameNative?: string;
  country: string;
  countryNative?: string;
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
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isTrackingSatellite, setIsTrackingSatellite] = useState(false);
  const [trackingTrigger, setTrackingTrigger] = useState(0);
  const [orbitTrailsEnabled, setOrbitTrailsEnabled] = useState(true);


  // Orbital Lens State
  const [isLensActive, setIsLensActive] = useState(false);
  const [lensLoading, setLensLoading] = useState(false);

  // Fetch ISS pass for location mode
  const [issPass, setIssPass] = useState<{ nextPass: number | null, maxElevationDegrees: number | null } | null>(null);
  const [issPassLoading, setIssPassLoading] = useState(false);

  useEffect(() => {
    if (consoleMode === 'location' && selectedLocation) {
      setIssPassLoading(true);
      fetch(`/api/iss-pass?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`)
        .then(res => res.json())
        .then(data => {
          if (!data.error) setIssPass(data);
        })
        .catch(console.error)
        .finally(() => setIssPassLoading(false));
    } else {
      setIssPass(null);
    }
  }, [consoleMode, selectedLocation]);

  const coordsRef = useRef(selectedLocation);
  useLayoutEffect(() => { coordsRef.current = selectedLocation; }, [selectedLocation]);

  // Fetch TLEs when a layer is enabled, lens is active, or periodically
  useEffect(() => {
    let active = true;

    async function fetchLayer(category: SatelliteCategory) {
      // Don't check activeLayers[category] here, because lens might require it
      try {
        const res = await fetch(`/api/satellites/${category}`);
        if (!res.ok || !active) return;
        const data: LayerPayload = await res.json();
        setSatellitesMap(prev => ({ ...prev, [category]: data }));
      } catch (err) {
        console.error(`Failed to fetch layer ${category}`, err);
      }
    }

    const requiredForLens: SatelliteCategory[] = ['stations', 'gps', 'weather', 'iridium', 'starlink'];
    const catsToFetch = new Set<SatelliteCategory>();
    
    (Object.keys(activeLayers) as SatelliteCategory[]).forEach(cat => {
      if (activeLayers[cat]) catsToFetch.add(cat);
    });
    
    if (isLensActive || lensLoading) {
      requiredForLens.forEach(cat => catsToFetch.add(cat));
    }

    catsToFetch.forEach(cat => {
      if (!satellitesMap[cat]) {
        fetchLayer(cat);
      }
    });

    // Refresh every hour for long-lived sessions
    const interval = setInterval(() => {
      catsToFetch.forEach(cat => {
        fetchLayer(cat);
      });
    }, 60 * 60_000);

    return () => { active = false; clearInterval(interval); };
  }, [activeLayers, isLensActive, lensLoading]); // Intentionally omitting satellitesMap from dependency to avoid loop

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
    setTelemetry(null);
    setLocationMeta(null);
    setIsBookOpen(false); // Hide the book while loading new data

    try {
      const telRes = await fetch(`/api/telemetry?lat=${lat}&lon=${lon}`);
      if (telRes.ok) {
        const tel: TelemetryData = await telRes.json();
        setTelemetry(tel);
        setLocationMeta({ lat, lon, name: tel.location, nameNative: tel.locationNative, country: tel.country, countryNative: tel.countryNative });
        setIsBookOpen(true); // Open book only after data is ready
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
    setIsTrackingSatellite(true);
    setTrackingTrigger(prev => prev + 1);
    // We intentionally keep selectedLocation, telemetry, and locationMeta intact
  }, [satellitesMap]);

  // Console Clear / Close handler
  const handleClearSelection = useCallback(() => {
    setIsTrackingSatellite(false);
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

  // Handle Intelligence Panel Quick Actions
  const handlePanelAction = useCallback((action: 'center' | 'toggle-trail') => {
    if (action === 'center') {
      setIsTrackingSatellite(true);
      setTrackingTrigger(prev => prev + 1);
    } else if (action === 'toggle-trail') {
      setOrbitTrailsEnabled(prev => !prev);
    }
  }, []);

  const handleLensLoaded = useCallback(() => {
    setLensLoading(false);
  }, []);

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

  const hasMeaningfulContent = isLensActive || consoleMode !== 'default';
  const showIntelligencePanel = hasMeaningfulContent && !(consoleMode === 'location' && isBookOpen);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#020617] font-primary">
      {/* Globe */}
      <div
        className="absolute inset-0 transition-all duration-500 ease-in-out"
        style={{ right: showIntelligencePanel ? "min(500px, 100vw)" : "0px" }}
      >
        <GlobeViewer
          satellitesMap={satellitesMap}
          activeLayers={activeLayers}
          selectedSatelliteId={selectedSatelliteId}
          trackedSatelliteId={isTrackingSatellite ? `${selectedSatelliteId}_${trackingTrigger}` : null}
          orbitTrailsEnabled={orbitTrailsEnabled}
          onLocationSelect={handleLocationSelect}
          onSatelliteSelect={handleSatelliteSelect}
          selectedLocation={selectedLocation}
          isLensActive={isLensActive}
          onLensLoaded={handleLensLoaded}
        />

        {/* Orbit Legend */}
        <AnimatePresence>
          {orbitTrailsEnabled && (consoleMode === 'satellite' || consoleMode === 'iss' || selectedSatelliteId) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-5 left-5 z-30 flex items-center gap-4 bg-black/70 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2.5 pointer-events-none select-none"
            >
              <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase mr-1">Orbit</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-[2px] bg-white/40 rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0px, rgba(255,255,255,0.4) 3px, transparent 3px, transparent 6px)' }} />
                <span className="text-[10px] font-mono text-slate-400">Past</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-mono text-slate-400">Now</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-[2.5px] rounded-full bg-[#00E5FF] shadow-[0_0_6px_rgba(0,229,255,0.4)]" />
                <span className="text-[10px] font-mono text-slate-400">Future</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cosmic Book Overlay for Location Mode */}
      <CosmicBookOverlay
        isOpen={isBookOpen && consoleMode === 'location'}
        onClose={() => setIsBookOpen(false)}
        location={locationMeta}
        telemetry={telemetry}
        issPass={issPass}
        issPassLoading={issPassLoading}
      />

      {/* Cinematic Lens Loading Overlay */}
      <AnimatePresence>
        {lensLoading && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none overflow-hidden"
          >
            {/* Background Data Streams (Simulated TLE Hex) */}
            <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-8 overflow-hidden font-mono text-[8px] text-[#00E5FF] leading-none break-all select-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0.1 }}
                  animate={{ opacity: [0.1, 0.8, 0.1] }}
                  transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                >
                  {Math.random().toString(36).substring(2, 15).toUpperCase()} 1 {Math.floor(Math.random()*90000)}U {Math.floor(Math.random()*99)}0{Math.floor(Math.random()*99)}A   {Math.floor(Math.random()*99)}{Math.floor(Math.random()*999)}.{Math.floor(Math.random()*99999999)}  .00000{Math.floor(Math.random()*999)}  00000-0  {Math.floor(Math.random()*9999)}-4 0  999
                </motion.span>
              ))}
            </div>

            <div className="absolute inset-0 bg-black/50 mix-blend-multiply" />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="relative z-10 flex flex-col items-center"
            >
              {/* Massive Orbital Radar Visual */}
              <div className="w-[400px] h-[400px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                {/* Outer Orbit Path */}
                <div className="absolute inset-0 rounded-full border border-dashed border-[#00E5FF]/20 animate-[spin_60s_linear_infinite]" />
                {/* Inner Orbit Path */}
                <div className="absolute inset-16 rounded-full border border-[#00E5FF]/10 animate-[spin_40s_linear_infinite_reverse]" />
                
                {/* Orbiting Satellites */}
                <motion.div 
                  className="absolute inset-0 origin-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]">
                    <Satellite className="w-6 h-6 rotate-45" strokeWidth={1.5} />
                  </div>
                </motion.div>
                
                <motion.div 
                  className="absolute inset-16 origin-center"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                    <Radio className="w-5 h-5" strokeWidth={2} />
                  </div>
                </motion.div>
              </div>

              {/* Central Interface Hub */}
              <div className="relative z-10 bg-black/40 border border-[#00E5FF]/30 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.1)] flex flex-col items-center">
                <Crosshair className="w-12 h-12 text-[#00E5FF] opacity-80 mb-6 animate-pulse" strokeWidth={1} />
                
                <h2 className="text-2xl md:text-4xl font-light tracking-[0.3em] text-white uppercase mb-4 whitespace-nowrap" style={{ textShadow: "0 0 30px rgba(0, 229, 255, 0.6)" }}>
                  <span className="text-[#00E5FF] opacity-60 mr-4">[</span>
                  Orbital Lens
                  <span className="text-[#00E5FF] opacity-60 ml-4">]</span>
                </h2>
                
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#00E5FF]/50" />
                  <p className="font-mono text-sm text-[#00E5FF] tracking-[0.4em] uppercase opacity-90 drop-shadow-[0_0_8px_#00E5FF]">
                    Computing Congestion Field
                  </p>
                  <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#00E5FF]/50" />
                </div>
                
                <div className="mt-8 flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-1 bg-[#00E5FF]/20 overflow-hidden relative"
                    >
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ 
                          duration: 1, 
                          repeat: Infinity, 
                          ease: "easeInOut",
                          delay: i * 0.15 
                        }}
                        className="absolute inset-y-0 w-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]"
                      />
                    </motion.div>
                  ))}
                </div>
                
                <p className="mt-6 font-mono text-[10px] text-slate-400 tracking-widest uppercase">
                  Projecting TLE Subpoints • Calculating Density
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => {
              if (!isLensActive) {
                setLensLoading(true);
                setIsLensActive(true);
              } else {
                setIsLensActive(false);
              }
            }}
            className={`relative flex items-center gap-3 px-6 py-2.5 rounded-full border backdrop-blur-md transition-all duration-500 font-mono text-xs md:text-sm tracking-widest uppercase group overflow-hidden ${
              isLensActive 
                ? 'bg-[#00E5FF]/20 border-[#00E5FF]/60 text-white shadow-[0_0_30px_rgba(0,229,255,0.4)]' 
                : 'bg-black/40 hover:bg-[#00E5FF]/10 border-white/20 hover:border-[#00E5FF]/40 text-slate-300 hover:text-white shadow-lg'
            }`}
          >
            {/* Animated Background Glow */}
            {isLensActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00E5FF]/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            )}
            
            <div className={`relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-500 ${isLensActive ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_#00E5FF]' : 'bg-white/10 text-slate-400 group-hover:text-[#00E5FF]'}`}>
              <Aperture className={`w-4 h-4 transition-transform duration-700 ${isLensActive ? 'animate-[spin-slow_4s_linear_infinite]' : 'group-hover:rotate-90'}`} />
              {isLensActive && (
                <div className="absolute inset-0 rounded-full border border-[#00E5FF] animate-ping opacity-50" />
              )}
            </div>
            
            <span className={`font-semibold tracking-[0.2em] transition-colors duration-300 ${isLensActive ? 'text-[#00E5FF] drop-shadow-[0_0_8px_#00E5FF]' : ''}`}>
              Orbital Lens
            </span>
          </button>
          

          <LocationSearch onLocationSelect={handleLocationSelect} />
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          {consoleMode === 'location' && !isBookOpen && (
            <button
              onClick={() => setIsBookOpen(true)}
              className="bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] px-4 py-1.5 rounded-full backdrop-blur-md transition-colors font-mono text-[10px] tracking-wider uppercase mr-2"
            >
              Open Atlas
            </button>
          )}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 backdrop-blur-md rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase">Live</span>
          </div>
        </div>
      </div>

      {/* Intelligence Panel */}
      <div
        className={`absolute bottom-0 md:top-4 md:bottom-4 right-0 md:right-4 w-full md:max-w-[420px] h-[70vh] md:h-[calc(100vh-32px)] z-40 rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ease-in-out ${showIntelligencePanel ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'}`}
      >
        <IntelligencePanel
          consoleMode={consoleMode}
          activeLayers={activeLayers}
          satellitesMap={satellitesMap}
          location={locationMeta}
          telemetry={telemetry}
          satellite={liveSelectedSatellite}
          orbitTrailsEnabled={orbitTrailsEnabled}
          loading={loading}
          isLensActive={isLensActive}
          onClose={handleClearSelection}
          onAction={handlePanelAction}
        />
      </div>


    </div>
  );
}
