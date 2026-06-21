"use client";

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TUNNEL_LENGTH } from './TimeMachineScene';

export function TemporalCorridor() {
  const ringsRef = useRef<THREE.InstancedMesh>(null);
  const numRings = 40;

  // Generate transformation matrices for the background tunnel rings
  const ringMatrices = useMemo(() => {
    const matrices = [];
    const tempObject = new THREE.Object3D();
    
    for (let i = 0; i < numRings; i++) {
      // Distribute rings evenly along the tunnel
      const zPos = 10 - (i / numRings) * (TUNNEL_LENGTH + 50);
      tempObject.position.set(0, 0, zPos);
      
      // Random subtle rotations
      tempObject.rotation.z = Math.random() * Math.PI;
      
      // Update matrix
      tempObject.updateMatrix();
      matrices.push(tempObject.matrix.clone());
    }
    return matrices;
  }, [numRings]);

  React.useLayoutEffect(() => {
    if (ringsRef.current) {
      ringMatrices.forEach((matrix, i) => {
        ringsRef.current!.setMatrixAt(i, matrix);
      });
      ringsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [ringMatrices]);

  useFrame((state, delta) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z -= delta * 0.05;
    }
  });

  return (
    <group>
      {/* Background generic tunnel rings */}
      <instancedMesh ref={ringsRef} args={[null as any, null as any, numRings]}>
        <torusGeometry args={[8, 0.02, 16, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.1} />
      </instancedMesh>
      
      {/* Dense Gateway / Stargate Entrance */}
      <group position={[0, 0, -5]}>
        {Array.from({ length: 20 }).map((_, i) => (
          <mesh key={`gateway-${i}`} position={[0, 0, -i * 0.5]}>
            <torusGeometry args={[7 - (i * 0.1), 0.05 + (i * 0.01), 16, 100]} />
            <meshBasicMaterial color={i % 2 === 0 ? "#00E5FF" : "#ffffff"} transparent opacity={0.8 - (i * 0.03)} />
          </mesh>
        ))}
      </group>

      {/* Specific Checkpoint Year Gates */}
      {Array.from({ length: 6 }).map((_, i) => {
        const zPos = -i * (TUNNEL_LENGTH / 5);
        return (
          <group key={`year-gate-${i}`} position={[0, 0, zPos]}>
            <mesh>
              <torusGeometry args={[6, 0.05, 16, 100]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
            </mesh>
            <mesh>
              <torusGeometry args={[6.1, 0.01, 16, 100]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
