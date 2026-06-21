"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScroll } from '@react-three/drei';
import * as THREE from 'three';
import { COSMIC_TIME_MACHINE_YEARS } from '@/lib/timeMachineData';

export function OrbitalEarthStage() {
  const scroll = useScroll();
  const { camera } = useThree();
  const earthGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  // Pre-generate 58,000 random particle positions around the Earth (radius ~2 to ~4)
  const maxParticles = 58000;
  const positions = useMemo(() => {
    const pos = new Float32Array(maxParticles * 3);
    for (let i = 0; i < maxParticles; i++) {
      const r = 2.1 + Math.random() * 2.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (!earthGroupRef.current || !particlesRef.current || !materialRef.current) return;

    // Keep Earth exactly 12 units in front of the camera
    earthGroupRef.current.position.z = camera.position.z - 12;

    // Slowly rotate the Earth
    earthGroupRef.current.rotation.y += delta * 0.05;

    // Interpolate data based on scroll
    const safeOffset = THREE.MathUtils.clamp(scroll.offset, 0, 1);
    const numCheckpoints = COSMIC_TIME_MACHINE_YEARS.length;
    
    // Find which two checkpoints we are between
    const exactIndex = safeOffset * (numCheckpoints - 1);
    const index1 = Math.floor(exactIndex);
    const index2 = Math.min(index1 + 1, numCheckpoints - 1);
    const t = exactIndex - index1; // Interpolation factor (0 to 1)

    const data1 = COSMIC_TIME_MACHINE_YEARS[index1];
    const data2 = COSMIC_TIME_MACHINE_YEARS[index2];

    // Lerp Active Satellites
    const currentActive = THREE.MathUtils.lerp(data1.activeSatellites, data2.activeSatellites, t);
    
    // Update visible particle count based on active satellites (cap at maxParticles)
    particlesRef.current.geometry.setDrawRange(0, Math.min(Math.floor(currentActive), maxParticles));

    // Rotate particles slightly faster than Earth
    particlesRef.current.rotation.y += delta * 0.08;
    particlesRef.current.rotation.x += delta * 0.02;

    // Lerp Visual Intensity (0-100)
    const currentIntensity = THREE.MathUtils.lerp(data1.visualIntensity, data2.visualIntensity, t);
    
    // Lerp Color from calm blue to warning red based on intensity
    const color1 = new THREE.Color('#00E5FF'); // Calm Cyan
    const color2 = new THREE.Color('#FF3333'); // Aggressive Red
    
    // Normalize intensity (0 to 100) to (0 to 1)
    const colorT = Math.pow(currentIntensity / 100, 2); // Non-linear curve so it gets redder faster at the end
    materialRef.current.color.lerpColors(color1, color2, colorT);
    
    // Size increases slightly with intensity to create bloom feeling
    materialRef.current.size = 0.015 + (currentIntensity / 100) * 0.02;
  });

  return (
    <group ref={earthGroupRef}>
      {/* The Earth */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial 
          color="#0a192f" 
          emissive="#020617"
          emissiveIntensity={0.5}
          wireframe={true} 
          transparent={true}
          opacity={0.3}
        />
      </mesh>
      
      {/* Inner Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[1.95, 32, 32]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.1} />
      </mesh>

      {/* The Particle System (Satellites) */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial 
          ref={materialRef}
          size={0.015} 
          color="#00E5FF" 
          transparent 
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
