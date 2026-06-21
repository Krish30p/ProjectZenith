"use client";

import React from 'react';
import { Html } from '@react-three/drei';
import { COSMIC_TIME_MACHINE_YEARS } from '@/lib/timeMachineData';
import { TUNNEL_LENGTH } from './TimeMachineScene';
import { Aperture, ArrowRight, Activity, AlertTriangle } from 'lucide-react';

export function CheckpointOverlay() {
  return (
    <group>
      {COSMIC_TIME_MACHINE_YEARS.map((data, i) => {
        // Place the overlay exactly 10 units in front of where the camera will stop for this checkpoint
        const zPos = -i * (TUNNEL_LENGTH / 5) - 10;
        
        // Alternate left and right side for visual rhythm
        const xPos = i % 2 === 0 ? -4 : 4;

        return (
          <Html 
            key={data.year} 
            position={[xPos, 0, zPos]} 
            transform 
            distanceFactor={15}
            className="w-96 pointer-events-none"
          >
            <div className="flex flex-col gap-4">
              {/* Year Hologram */}
              <div className="flex flex-col items-start">
                <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                  {data.year}
                </h1>
                <div className={`mt-2 px-3 py-1 rounded-sm border backdrop-blur-sm flex items-center gap-2 text-xs font-bold tracking-widest uppercase ${
                  data.isProjected 
                    ? 'border-[#FF3333]/50 bg-[#FF3333]/10 text-[#FF3333] shadow-[0_0_15px_rgba(255,51,51,0.2)]'
                    : 'border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]'
                }`}>
                  {data.isProjected ? <AlertTriangle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  {data.eraLabel}
                </div>
              </div>

              {/* Data Panel */}
              <div className="bg-[#020617]/60 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">{data.headline}</h3>
                <p className="text-sm text-[#00E5FF] mb-4">{data.subheadline}</p>
                
                <div className="h-px w-full bg-white/10 mb-4" />

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Active Assets</span>
                    <span className="text-2xl font-mono text-white">
                      {data.activeSatellites.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Congestion</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-mono ${data.congestionScore > 80 ? 'text-[#FF3333]' : 'text-white'}`}>
                        {data.congestionScore}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {data.insightText}
                </p>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                    {data.disclosureLabel}
                  </p>
                </div>
              </div>

              {/* Final CTA if it's the last checkpoint */}
              {i === COSMIC_TIME_MACHINE_YEARS.length - 1 && (
                <div className="mt-8 pointer-events-auto">
                  <a 
                    href="/observatory"
                    className="group relative inline-flex items-center gap-3 px-6 py-3 bg-[#00E5FF]/10 border border-[#00E5FF]/50 rounded-full hover:bg-[#00E5FF]/20 transition-all cursor-pointer"
                  >
                    <span className="text-white font-medium tracking-wide">Enter Launch Observatory</span>
                    <Aperture className="w-4 h-4 text-[#00E5FF] group-hover:rotate-90 transition-transform" />
                  </a>
                </div>
              )}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
