// Proper type declarations for satellite.js
// The library uses untyped internal data structures so we define minimal interfaces

interface EciPosition {
  x: number;
  y: number;
  z: number;
}

interface EcfPosition {
  x: number;
  y: number;
  z: number;
}

interface SatRec {
  error: number;
  [key: string]: unknown;
}

interface LookAngles {
  azimuth: number;
  elevation: number;
  range: number;
}

interface GeodeticCoords {
  longitude: number;
  latitude: number;
  height: number;
}

interface ObserverGd {
  longitude: number;
  latitude: number;
  height: number;
}

declare module 'satellite.js' {
  export function gstime(date: Date): number;
  export function degreesToRadians(degrees: number): number;
  export function radiansToDegrees(radians: number): number;
  export function twoline2satrec(line1: string, line2: string): SatRec;
  export function propagate(satrec: SatRec, date: Date): { position: EciPosition | boolean; velocity: EciPosition | boolean };
  export function eciToGeodetic(positionEci: EciPosition, gmst: number): GeodeticCoords;
  export function eciToEcf(positionEci: EciPosition, gmst: number): EcfPosition;
  export function ecfToLookAngles(observerGd: ObserverGd, positionEcf: EcfPosition): LookAngles;
}
