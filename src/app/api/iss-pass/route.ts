import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? 'NaN');
  const lon = parseFloat(searchParams.get('lon') ?? 'NaN');

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const satrec = await getIssSatrec();
  if (!satrec) {
    return NextResponse.json({ error: 'ISS TLE unavailable' }, { status: 503 });
  }

  const observerGd = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0,
  };

  const now = new Date();
  let wasAbove = false;
  let nextPass: number | null = null;
  let maxElevationRad = 0;
  let inPass = false;

  // Step every 20s for 24 hours (4320 steps)
  for (let i = 0; i < 4320; i++) {
    const t = new Date(now.getTime() + i * 20_000);
    const gmst = satellite.gstime(t);
    const pv = satellite.propagate(satrec, t);
    const pos = pv.position;

    if (typeof pos !== 'object') continue;

    const ecf = satellite.eciToEcf(pos, gmst);
    const angles = satellite.ecfToLookAngles(observerGd, ecf);
    const isAbove = angles.elevation > 0.05; // ~3°

    if (isAbove && !wasAbove) {
      nextPass = t.getTime();
      inPass = true;
      maxElevationRad = angles.elevation;
    } else if (isAbove && inPass) {
      if (angles.elevation > maxElevationRad) maxElevationRad = angles.elevation;
    } else if (!isAbove && wasAbove && inPass) {
      break; // found the pass
    }

    wasAbove = isAbove;
  }

  return NextResponse.json({
    nextPass,
    maxElevationDegrees: nextPass ? parseFloat((maxElevationRad * 180 / Math.PI).toFixed(1)) : null,
  });
}
