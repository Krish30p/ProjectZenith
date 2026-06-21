"use client";

import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Stars, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { TemporalCorridor } from './TemporalCorridor';
import { OrbitalEarthStage } from './OrbitalEarthStage';
import { CheckpointOverlay } from './CheckpointOverlay';
import { ObservationRoom } from './ObservationRoom';

export const TUNNEL_LENGTH = 500;

function CameraController() {
  const scroll = useScroll();
  const { camera } = useThree();
  
  useFrame(() => {
    // Move camera from Z=5 to Z=-TUNNEL_LENGTH based on scroll
    camera.position.z = 5 - scroll.offset * TUNNEL_LENGTH;
  });
  
  return null;
}

export function TimeMachineScene() {
  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#01030A']} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00E5FF" />
        
        <Suspense fallback={null}>
          <ScrollControls pages={7} damping={0.2} distance={1.5}>
            <CameraController />
            
            {/* The Starting Gateway Room */}
            <ObservationRoom />

            {/* Background stars */}
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            
            {/* The Corridor (Rings) */}
            <TemporalCorridor />
            
            {/* The Earth and Orbiting Particles */}
            <OrbitalEarthStage />
            
            {/* UI Overlays mapping to Z-depths */}
            <CheckpointOverlay />
          </ScrollControls>
        </Suspense>
      </Canvas>
      
      {/* Scroll indicator overlay */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-sm tracking-widest uppercase animate-pulse pointer-events-none">
        Scroll to travel time
      </div>
    </div>
  );
}
