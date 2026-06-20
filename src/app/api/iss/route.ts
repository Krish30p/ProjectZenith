import { NextResponse } from 'next/server';
import * as satellite from 'satellite.js';
import { promises as fs } from 'fs';
import path from 'path';

// Cache ISS TLE for 1 hour
interface IssCache {
  satrec: ReturnType<typeof satellite.twoline2satrec>;
  fetchedAt: number;
}
let issCache: IssCache | null = null;

async function getIssSatrec() {
  const now = Date.now();
  if (issCache && now - issCache.fetchedAt < 3_600_000) return issCache.satrec;

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
      return satrec;
    }
  } catch (e) {
    console.error('Failed to read active.txt for ISS', e);
  }
  return issCache?.satrec ?? null;
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
