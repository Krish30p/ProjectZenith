"use client";

import React from 'react';
import { Html, Grid } from '@react-three/drei';
import * as THREE from 'three';

export function ObservationRoom() {
  return (
    <group position={[0, 0, 0]}>
      {/* Floor */}
      <Grid 
        position={[0, -2.5, 0]} 
        args={[30, 100]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#00E5FF" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#0088AA" 
        fadeDistance={40}
        fadeStrength={1.5}
      />

      {/* Reflective Dark Floor Base */}
      <mesh position={[0, -2.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 100]} />
        <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Left Wall Panel */}
      <Html 
        transform 
        position={[-4.5, 0.5, 0]} 
        rotation={[0, Math.PI / 6, 0]}
        distanceFactor={10}
        className="pointer-events-none select-none"
      >
        <div className="w-[600px] h-[400px] bg-black/60 border border-[#00E5FF]/20 rounded-xl backdrop-blur-md p-10 flex flex-col items-center justify-start text-center shadow-[0_0_50px_rgba(0,229,255,0.1)]">
          <h2 className="text-3xl font-primary tracking-[0.2em] text-white uppercase mb-2">Cosmic Time Machine</h2>
          <p className="text-[#00E5FF] tracking-[0.3em] text-sm uppercase mb-10">Exploring the History of our Sky</p>
          
          {/* Wireframe Globe CSS representation */}
          <div className="relative w-48 h-48 rounded-full border-2 border-[#00E5FF]/30 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.1)_0%,transparent_70%)]" />
            <div className="absolute w-[200%] h-[1px] bg-[#00E5FF]/20 -rotate-45" />
            <div className="absolute w-[200%] h-[1px] bg-[#00E5FF]/20 rotate-45" />
            <div className="absolute w-[1px] h-[200%] bg-[#00E5FF]/20" />
            <div className="absolute w-[200%] h-[1px] bg-[#00E5FF]/20" />
            <div className="w-48 h-48 rounded-full border border-[#00E5FF]/40 absolute scale-75 rotate-x-60" style={{ transform: 'rotateX(60deg)' }} />
            <div className="w-48 h-48 rounded-full border border-[#00E5FF]/40 absolute scale-75 rotate-y-60" style={{ transform: 'rotateY(60deg)' }} />
          </div>
        </div>
      </Html>

      {/* Right Wall Panel */}
      <Html 
        transform 
        position={[4.5, 0.5, 0]} 
        rotation={[0, -Math.PI / 6, 0]}
        distanceFactor={10}
        className="pointer-events-none select-none"
      >
        <div className="w-[600px] h-[400px] bg-black/60 border border-[#00E5FF]/20 rounded-xl backdrop-blur-md p-10 flex flex-col items-center justify-start shadow-[0_0_50px_rgba(0,229,255,0.1)]">
          <h2 className="text-3xl font-primary tracking-[0.2em] text-white uppercase mb-4">Travel Through Time</h2>
          <p className="text-slate-400 tracking-widest text-lg mb-12">2010 — 2035</p>

          <div className="w-full relative flex items-center justify-between px-4 mb-16">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/20 -z-10" />
            {['2010', '2015', '2020', '2025', '2030', '2035'].map((yr, i) => (
              <div key={yr} className="flex flex-col items-center gap-3">
                <span className="text-xs text-slate-500 font-mono">{yr}</span>
                <div className="w-4 h-4 rounded-full bg-[#00E5FF]/50 border border-[#00E5FF]" />
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col items-center">
            <div className="text-2xl font-black text-white tracking-[0.3em] mb-2">ZENITH</div>
            <div className="text-[10px] text-slate-500 tracking-[0.4em] uppercase">Observe. Understand. Protect.</div>
          </div>
        </div>
      </Html>

      {/* Structural Pillars */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[0, -5, -10].map((zPos) => (
            <mesh key={zPos} position={[side * 7, 0, zPos]}>
              <cylinderGeometry args={[0.2, 0.2, 6, 16]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
          {/* Glowing Accents on pillars */}
          {[0, -5, -10].map((zPos) => (
            <mesh key={zPos + 'glow'} position={[side * 6.9, 0, zPos]}>
              <boxGeometry args={[0.1, 4, 0.1]} />
              <meshBasicMaterial color="#00E5FF" />
            </mesh>
          ))}
        </group>
      ))}

    </group>
  );
}
