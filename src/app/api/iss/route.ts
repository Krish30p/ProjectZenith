import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';

// Cache ISS TLE for 1 hour
interface IssCache {
  satrec: ReturnType<typeof satellite.twoline2satrec>;
  fetchedAt: number;
}
let issCache: IssCache | null = null;

async function getIssSatrec() {
  const now = Date.now();
  if (issCache && now - issCache.fetchedAt < 3_600_000) return issCache.satrec;

  const res = await fetch(
    'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle',
    { cache: 'no-store' }
  ).catch(() => null);

  if (!res?.ok) return issCache?.satrec ?? null;

  const text = await res.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 3) return issCache?.satrec ?? null;

  try {
    const satrec = satellite.twoline2satrec(lines[1], lines[2]);
    issCache = { satrec, fetchedAt: now };
    return satrec;
  } catch {
    return issCache?.satrec ?? null;
  }
}

export async function GET() {
  const satrec = await getIssSatrec();
  if (!satrec) {
    return NextResponse.json({ error: 'ISS TLE unavailable' }, { status: 503 });
  }

  const now = new Date();
  const gmst = satellite.gstime(now);
  const pv = satellite.propagate(satrec, now);
  const pos = pv.position;

  if (typeof pos !== 'object') {
    return NextResponse.json({ error: 'Failed to propagate ISS orbit' }, { status: 500 });
  }

  const geo = satellite.eciToGeodetic(pos, gmst);
  const latitude = satellite.radiansToDegrees(geo.latitude);
  const longitude = satellite.radiansToDegrees(geo.longitude);

  // Compute 90-min orbit path (every 2 minutes = 45 points)
  const orbitPath: { lat: number; lon: number }[] = [];
  for (let i = -45; i <= 45; i++) {
    const t = new Date(now.getTime() + i * 2 * 60_000);
    const g = satellite.gstime(t);
    const p = satellite.propagate(satrec, t);
    if (typeof p.position !== 'object') continue;
    const geo2 = satellite.eciToGeodetic(p.position, g);
    orbitPath.push({
      lat: satellite.radiansToDegrees(geo2.latitude),
      lon: satellite.radiansToDegrees(geo2.longitude),
    });
  }

  return NextResponse.json({ latitude, longitude, orbitPath });
}
