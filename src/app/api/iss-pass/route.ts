import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';
import { promises as fs } from 'fs';
import path from 'path';

interface IssCache {
  satrec: ReturnType<typeof satellite.twoline2satrec>;
  fetchedAt: number;
}
let issCache: IssCache | null = null;
let activeRefresh: Promise<void> | null = null;

async function refreshIssSatrec() {
  const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle';
  const now = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 21600 }, // 6 hours
    });
    if (!res.ok) throw new Error(`CelesTrak stations fetch failed: ${res.status}`);
    
    const text = await res.text();
    const lines = text.split(/\r?\n/);
    let line1 = '';
    let line2 = '';
    for (let i = 0; i < lines.length - 2; i += 3) {
      if (lines[i].includes('ISS (ZARYA)') || lines[i+1].includes('25544U')) {
        line1 = lines[i+1].trim();
        line2 = lines[i+2].trim();
        break;
      }
    }
    if (line1 && line2) {
      const satrec = satellite.twoline2satrec(line1, line2);
      issCache = { satrec, fetchedAt: now };
      console.log('[ISS API] Successfully fetched live CelesTrak ISS TLE.');
    }
  } catch (error) {
    console.warn('[ISS API] Live fetch failed for ISS. Falling back to active.txt.', error);
    if (issCache) return;

    try {
      const text = await fs.readFile(path.join(process.cwd(), 'active.txt'), 'utf-8');
      const lines = text.split(/\r?\n/);
      let line1 = '';
      let line2 = '';
      for (let i = 0; i < lines.length - 2; i += 3) {
        if (lines[i].includes('ISS (ZARYA)') || lines[i+1].includes('25544U')) {
          line1 = lines[i+1].trim();
          line2 = lines[i+2].trim();
          break;
        }
      }
      if (line1 && line2) {
        const satrec = satellite.twoline2satrec(line1, line2);
        issCache = { satrec, fetchedAt: now };
      }
    } catch (fsErr) {
      console.error('Failed to read active.txt for ISS', fsErr);
    }
  }
}

async function getIssSatrec() {
  const isStale = !issCache || (Date.now() - issCache.fetchedAt > 6 * 60 * 60 * 1000); // 6h TTL
  
  if (issCache && isStale && !activeRefresh) {
    activeRefresh = refreshIssSatrec().finally(() => { activeRefresh = null; });
  }
  
  if (!issCache) {
    if (!activeRefresh) {
      activeRefresh = refreshIssSatrec().finally(() => { activeRefresh = null; });
    }
    await activeRefresh;
  }
  
  return issCache?.satrec ?? null;
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
