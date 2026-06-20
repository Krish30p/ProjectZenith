export type SatelliteCategory = 'stations' | 'starlink' | 'gps' | 'weather' | 'iridium';

export interface TleData {
  id: string;          // Norad ID
  name: string;        // Cleaned string
  category: SatelliteCategory;
  tleLine1: string;
  tleLine2: string;
  tleEpoch: number;    // TLE epoch timestamp
  fetchedAt: number;   // Server fetch timestamp
}

export interface LiveSatellite extends TleData {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKms: number;
  inclination: number;
  orbitPath?: { lat: number; lon: number }[]; // Only populated when selected
}
export type SatelliteSource = "live-celestrak" | "cached-celestrak" | "local-fallback";

export interface LayerPayload {
  category: SatelliteCategory;
  source: SatelliteSource;
  fetchedAt: number;
  satellites: TleData[];
}
