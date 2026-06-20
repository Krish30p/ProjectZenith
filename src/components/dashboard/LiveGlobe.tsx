"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const CesiumViewer = dynamic(() => import('./CesiumViewer'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] text-[#00E5FF]">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <p className="font-mono text-sm tracking-widest uppercase">Initializing Cesium Ion Engine...</p>
    </div>
  )
});

interface Props {
  coordinates: { lat: number; lon: number };
  issPosition?: { latitude: number; longitude: number } | null;
}

export default function LiveGlobe({ coordinates, issPosition }: Props) {
  return (
    <div className="absolute inset-0">
      <CesiumViewer coordinates={coordinates} issPosition={issPosition} />

      {/* Return Home Overlay Button */}
      <div className="absolute bottom-10 right-10 z-50">
        <Link href="/" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-full font-primary font-semibold tracking-wide flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(0,229,255,0.2)] hover:shadow-[0_0_40px_rgba(0,229,255,0.4)] hover:scale-105">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00E5FF]"></span>
          </span>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
