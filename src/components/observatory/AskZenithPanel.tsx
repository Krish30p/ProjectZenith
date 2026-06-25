"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Send, Sparkles, MapPin, Globe2, Satellite, Rocket, 
  Maximize2, Activity, Info, Shield, HelpCircle, Eye,
  Cloud, Sun, Moon, Target, Layers
} from "lucide-react";
import { ConsoleMode } from "./ObservatoryClient";
import { TelemetryData } from "./IntelligencePanel";
import { LiveSatellite, SatelliteCategory } from "@/lib/satellites";
import { format, formatDistanceToNow } from "date-fns";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  consoleMode: ConsoleMode;
  location: { lat: number; lon: number; name: string; country: string } | null;
  telemetry: TelemetryData | null;
  satellite: (LiveSatellite & { source?: string; layerFetchedAt?: number }) | null;
  activeLayers: Record<SatelliteCategory, boolean>;
  issPass: { nextPass: number | null, maxElevationDegrees: number | null } | null;
}

export default function AskZenithPanel({
  isOpen, onClose, consoleMode, location, telemetry, satellite, activeLayers, issPass
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.values(activeLayers).filter(Boolean).length;
  const totalTracked = activeCount * 2450; 

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    const userMsg = text.trim();
    const timestamp = format(new Date(), "HH:mm");
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp }]);
    setInput("");
    setIsLoading(true);

    try {
      const contextPayload = { consoleMode, location, telemetry, satellite, activeLayers, issPass };

      const res = await fetch("/api/ask-zenith", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          context: contextPayload,
          history: messages.slice(-5)
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Failed to fetch response");
      }
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: format(new Date(), "HH:mm") }]);
      
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || "I am unable to process that query at the moment. Please verify your connection to the observatory telemetry stream.";
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Not JSON, ignore
      }

      setMessages(prev => [...prev, { role: 'assistant', content: `System Error: ${errorMessage}`, timestamp: format(new Date(), "HH:mm") }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getQuickPrompts = () => {
    if (consoleMode === 'location' && telemetry) {
      return [
        { icon: <Activity className="w-3.5 h-3.5" />, text: "Why is my grief score high?" },
        { icon: <Eye className="w-3.5 h-3.5" />, text: "Can I see Saturn tonight?" },
        { icon: <Sun className="w-3.5 h-3.5" />, text: "What is the brightest object above?" },
        { icon: <Target className="w-3.5 h-3.5" />, text: "When is the next ISS pass?" },
        { icon: <Satellite className="w-3.5 h-3.5" />, text: "How many satellites are above me?" },
        { icon: <Cloud className="w-3.5 h-3.5" />, text: "What's hurting visibility most?" }
      ];
    }
    if (consoleMode === 'satellite' && satellite) {
      return [
        { icon: <HelpCircle className="w-3.5 h-3.5" />, text: "What does this satellite do?" },
        { icon: <Target className="w-3.5 h-3.5" />, text: "Why is it at this altitude?" },
        { icon: <Activity className="w-3.5 h-3.5" />, text: "Is this orbit live or fallback?" },
        { icon: <Layers className="w-3.5 h-3.5" />, text: "What does this constellation support?" }
      ];
    }
    if (consoleMode === 'iss' && satellite) {
      return [
        { icon: <Target className="w-3.5 h-3.5" />, text: "When will the ISS pass over my location?" },
        { icon: <Activity className="w-3.5 h-3.5" />, text: "Why is the ISS moving this fast?" },
        { icon: <MapPin className="w-3.5 h-3.5" />, text: "What does the ground track mean?" },
        { icon: <Globe2 className="w-3.5 h-3.5" />, text: "What is the ISS currently passing over?" }
      ];
    }
    return [
      { icon: <Layers className="w-3.5 h-3.5" />, text: "What layers are active?" },
      { icon: <Eye className="w-3.5 h-3.5" />, text: "What does Orbital Lens show?" },
      { icon: <Activity className="w-3.5 h-3.5" />, text: "How does Zenith measure congestion?" }
    ];
  };

  const prompts = getQuickPrompts();

  let modeBadgeText = "GLOBAL OBSERVATORY STATE";
  if (consoleMode === 'location') modeBadgeText = "LOCATION CONTEXT";
  if (consoleMode === 'satellite') modeBadgeText = "SATELLITE CONTEXT";
  if (consoleMode === 'iss') modeBadgeText = "ISS CONTEXT";

  const renderResponseFooter = (msgContent: string) => {
    const isError = msgContent.includes("unable to process") || msgContent.includes("GEMINI_API_KEY") || msgContent.includes("System Error:");
    if (isError) {
       return (
         <div className="mt-3 pt-2 border-t border-red-500/20 flex gap-2">
            <span className="text-[9px] font-mono tracking-widest uppercase text-red-500/70 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">System Error</span>
         </div>
       );
    }

    const chips = [];
    if (consoleMode === 'location') {
      chips.push({ text: "Cloud Cover", color: "bg-red-500" }, { text: "Orbital Traffic", color: "bg-red-500" }, { text: "Sky Quality", color: "bg-[#2BB1A4]" }, { text: "Visibility", color: "bg-[#2BB1A4]" });
    } else if (consoleMode === 'satellite') {
      chips.push({ text: "Satellite Source", color: "bg-amber-500" }, { text: "Orbital Data", color: "bg-[#2BB1A4]" }, { text: "Mission Identity", color: "bg-[#2BB1A4]" });
    } else if (consoleMode === 'iss') {
      chips.push({ text: "ISS Pass", color: "bg-[#2BB1A4]" }, { text: "Orbit Track", color: "bg-[#2BB1A4]" }, { text: "Velocity", color: "bg-[#2BB1A4]" });
    } else {
      chips.push({ text: "Orbital Traffic", color: "bg-[#2BB1A4]" }, { text: "Active Layers", color: "bg-[#2BB1A4]" });
    }

    return (
      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          {chips.map((c, idx) => (
            <span key={idx} className="text-xs font-medium text-slate-700 bg-black/5 px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-black/5">
              <span className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
              {c.text}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-1.5 text-slate-400">
          <Info className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium tracking-wide">Derived from live telemetry • Updated just now</span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* A dark overlay for the rest of the screen, if desired, but we'll stick to drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="absolute top-4 right-4 w-full md:w-[500px] h-[calc(100vh-32px)] z-50 bg-[#F4F4F0] rounded-3xl shadow-[-10px_0_40px_rgba(0,0,0,0.2)] flex flex-col font-primary overflow-hidden border border-white/50"
          >
            {/* Background Texture (faint vein/marble or topographic pattern if available, using a subtle gradient) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
                 style={{ backgroundImage: 'radial-gradient(circle at 100% 100%, #139D97 0%, transparent 50%), radial-gradient(circle at 0% 0%, #139D97 0%, transparent 50%)' }} />

            {/* =======================================
                A. Header 
               ======================================= */}
            <div className="relative shrink-0 pt-6 px-6 pb-4 z-20">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-[#2BB1A4]" />
                    <div className="absolute inset-2 rounded-full border-[2.5px] border-[#2BB1A4]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[0.15em] text-[#0A192F] uppercase leading-tight">
                      Ask Zenith
                    </h2>
                    <p className="text-sm text-slate-600">
                      Context-Aware Mission Copilot
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
                    <Maximize2 className="w-4 h-4 text-[#0A192F]" />
                  </button>
                  <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4 text-[#0A192F]" />
                  </button>
                </div>
              </div>
            </div>

            {/* =======================================
                B. Context Snapshot / Dossier Card 
               ======================================= */}
            <div className="relative z-10 shrink-0 px-6">
              <div className="bg-[#EEF0EC] border border-black/5 rounded-2xl p-4 relative overflow-hidden">
                {/* Header of Dossier */}
                <div className="flex justify-between items-center mb-4">
                  <div className="bg-[#8AC2BD] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                    {modeBadgeText}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#2BB1A4] text-[10px] font-bold tracking-widest uppercase">
                    LIVE <span className="w-1.5 h-1.5 rounded-full bg-[#2BB1A4]" />
                  </div>
                </div>

                {consoleMode === 'location' && location ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-[#0A192F]">
                        <MapPin className="w-4 h-4 text-[#2BB1A4]" strokeWidth={2.5} />
                        <span className="font-bold text-lg">{location.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono pl-6">
                        <Activity className="w-3 h-3 text-[#2BB1A4]" />
                        <span>{location.lat.toFixed(2)}° N, {location.lon.toFixed(2)}° E</span>
                        <span className="text-slate-300">•</span>
                        <span>{telemetry?.timezoneAbbr || 'UTC'}</span>
                      </div>
                    </div>
                    {telemetry && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Cloud Cover</p>
                          <p className="text-xl font-medium text-[#0A192F]">{telemetry.cloudCover}%</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{telemetry.cloudCover > 80 ? 'Overcast' : telemetry.cloudCover > 30 ? 'Partly Cloudy' : 'Clear'}</p>
                        </div>
                        <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Sky Quality</p>
                          <p className="text-xl font-medium text-[#0A192F]">{telemetry.skyQualityScore}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{telemetry.skyQualityScore! > 70 ? 'Good' : telemetry.skyQualityScore! > 40 ? 'Moderate' : 'Poor'}</p>
                        </div>
                        <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Visible Planets</p>
                          <p className="text-xl font-medium text-[#0A192F]">{telemetry.visiblePlanets?.length || 0}</p>
                          <div className="flex gap-1 mt-1">
                            {/* Dummy planets for visual match to screenshot */}
                            <div className="w-3 h-3 rounded-full bg-slate-300 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-slate-400 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-inner" />
                            <div className="w-3 h-3 rounded-full bg-orange-300 shadow-inner" />
                          </div>
                        </div>
                        <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Next ISS Pass</p>
                          <p className="text-lg font-medium text-[#0A192F]">{issPass?.nextPass ? formatDistanceToNow(issPass.nextPass, { addSuffix: false }).replace('about ', '~') : 'N/A'}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">From Now</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : consoleMode === 'satellite' && satellite ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-[#0A192F]">
                        <Satellite className="w-4 h-4 text-[#2BB1A4]" strokeWidth={2.5} />
                        <span className="font-bold text-lg">{satellite.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono pl-6">
                        <Activity className="w-3 h-3 text-[#2BB1A4]" />
                        <span>NORAD: {satellite.id}</span>
                        <span className="text-slate-300">•</span>
                        <span className="uppercase">{satellite.category}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Altitude</p>
                        <p className="text-xl font-medium text-[#0A192F]">{satellite.altitudeKm.toFixed(0)}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Kilometers</p>
                      </div>
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Velocity</p>
                        <p className="text-xl font-medium text-[#0A192F]">{satellite.velocityKms.toFixed(1)}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">km/s</p>
                      </div>
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Inclination</p>
                        <p className="text-xl font-medium text-[#0A192F]">{satellite.inclination.toFixed(1)}°</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Degrees</p>
                      </div>
                    </div>
                  </>
                ) : consoleMode === 'iss' && satellite ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-[#0A192F]">
                        <Rocket className="w-4 h-4 text-[#2BB1A4]" strokeWidth={2.5} />
                        <span className="font-bold text-lg">Int. Space Station</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono pl-6">
                        <Activity className="w-3 h-3 text-[#2BB1A4]" />
                        <span>ZARYA • NORAD: {satellite.id}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Altitude</p>
                        <p className="text-xl font-medium text-[#0A192F]">{satellite.altitudeKm.toFixed(0)}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">Kilometers</p>
                      </div>
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Velocity</p>
                        <p className="text-xl font-medium text-[#0A192F]">{satellite.velocityKms.toFixed(1)}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">km/s</p>
                      </div>
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Next Pass</p>
                        <p className="text-lg font-medium text-[#0A192F]">{issPass?.nextPass ? formatDistanceToNow(issPass.nextPass, { addSuffix: false }) : 'N/A'}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">From Now</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-[#0A192F]">
                        <Globe2 className="w-4 h-4 text-[#2BB1A4]" strokeWidth={2.5} />
                        <span className="font-bold text-lg">Global Observatory</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono pl-6">
                        <Activity className="w-3 h-3 text-[#2BB1A4]" />
                        <span>Monitoring planetary shell activity</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Active Layers</p>
                        <p className="text-xl font-medium text-[#0A192F]">{activeCount} / 5</p>
                      </div>
                      <div className="bg-[#F8F9F7] rounded-xl p-3 border border-black/5">
                        <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mb-1">Est. Tracked Objects</p>
                        <p className="text-xl font-medium text-[#0A192F]">~{totalTracked.toLocaleString()}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* =======================================
                C. Conversation Surface 
               ======================================= */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar flex flex-col">
              
              {messages.length === 0 && (
                <div className="mt-2">
                  <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs font-bold text-[#0A192F] tracking-wide">SUGGESTED QUERIES</h3>
                    <span className="text-xs text-[#2BB1A4] font-medium">Smart for your current view</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {prompts.map((prompt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(prompt.text)}
                        className="flex items-center gap-2 text-xs bg-transparent border border-[#2BB1A4]/30 text-[#0A192F] font-medium px-3 py-2.5 rounded-full hover:bg-[#2BB1A4]/5 hover:border-[#2BB1A4]/60 transition-all text-left shadow-sm"
                      >
                        <div className="text-[#2BB1A4]">{prompt.icon}</div>
                        <span className="truncate">{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-auto space-y-6 flex flex-col">
                {messages.map((msg, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={i} 
                    className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="flex items-end gap-3 max-w-[85%]">
                        <div className="bg-[#E4E6E1] text-[#0A192F] rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
                          {msg.content}
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="text-[10px] text-slate-500 font-medium">{msg.timestamp}</span>
                          <div className="w-8 h-8 rounded-full bg-[#E0E8E7] border border-[#2BB1A4]/30 flex items-center justify-center overflow-hidden">
                             {/* Generic user avatar silhouette */}
                             <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#139D97] mt-1.5">
                                <circle cx="12" cy="8" r="4" fill="currentColor" />
                                <path d="M4 22C4 17.5817 7.58172 14 12 14C16.4183 14 20 17.5817 20 22" fill="currentColor" />
                             </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-[#F4F6F2] border border-[#2BB1A4]/20 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-5 py-3 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <Sparkles className="w-3.5 h-3.5 text-[#139D97]" strokeWidth={2.5} />
                             <span className="text-[10px] font-bold tracking-widest text-[#139D97] uppercase">Zenith Analysis</span>
                           </div>
                           <span className="text-[10px] text-slate-500 font-medium">{msg.timestamp}</span>
                        </div>
                        <div className="px-5 pb-5 text-sm leading-relaxed text-[#0A192F] font-medium">
                          {msg.content.split('\n').map((line, j) => (
                            <p key={j} className={j > 0 ? "mt-3" : ""}>
                               {line.replace(/\*\*/g, '')}
                            </p>
                          ))}
                          {renderResponseFooter(msg.content)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {isLoading && (
                  <div className="w-full bg-[#F4F6F2] border border-[#2BB1A4]/20 rounded-2xl shadow-sm overflow-hidden">
                     <div className="px-5 py-3 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#139D97] animate-pulse" strokeWidth={2.5} />
                        <span className="text-[10px] font-bold tracking-widest text-[#139D97] uppercase">Processing</span>
                     </div>
                     <div className="px-5 pb-5 pt-2 flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-[#139D97] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                       <span className="w-1.5 h-1.5 bg-[#139D97] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                       <span className="w-1.5 h-1.5 bg-[#139D97] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* =======================================
                D. Command Bar 
               ======================================= */}
            <div className="relative z-20 shrink-0 px-6 pb-6 pt-2 bg-[#F4F4F0]">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center bg-white border border-[#2BB1A4]/40 rounded-2xl shadow-sm focus-within:border-[#139D97] focus-within:shadow-[0_0_15px_rgba(43,177,164,0.15)] transition-all duration-300"
              >
                <div className="pl-4 pr-1 text-slate-400">
                  {/* Subtle decorative line or icon if needed */}
                  <div className="w-[1.5px] h-6 bg-slate-200" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Zenith about the sky, location, or satellite..."
                  className="w-full bg-transparent text-[#0A192F] text-[13px] font-medium placeholder:text-slate-400 py-4 outline-none"
                />
                <div className="pr-3 pl-1 py-2">
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-full bg-[#139D97] hover:bg-[#0D8781] disabled:opacity-50 disabled:hover:bg-[#139D97] flex items-center justify-center transition-all duration-300 shadow-md"
                  >
                    <Send className="w-4 h-4 text-white -ml-0.5 mt-0.5" />
                  </button>
                </div>
              </form>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Shield className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium">
                  Zenith answers using your current observatory context.
                </p>
              </div>
            </div>

            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.02);
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(43, 177, 164, 0.2);
                border-radius: 4px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: rgba(43, 177, 164, 0.4);
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
