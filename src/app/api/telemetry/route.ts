import { NextResponse } from 'next/server';
import { Observer, MoonPhase, Body, Equator, Horizon } from 'astronomy-engine';
import * as satellite from 'satellite.js';
import { promises as fs } from 'fs';
import path from 'path';

// ─── TLE Cache (5 min TTL) ────────────────────────────────────────────────────
interface TleCache {
  satRecs: ReturnType<typeof satellite.twoline2satrec>[];
  fetchedAt: number;
}
let tleCache: TleCache | null = null;

async function getSatRecs() {
  const now = Date.now();
  if (tleCache && now - tleCache.fetchedAt < 5 * 60_000) return tleCache.satRecs;

  try {
    const text = await fs.readFile(path.join(process.cwd(), 'active.txt'), 'utf-8');
    const lines = text.split(/\r?\n/);
    const satRecs: ReturnType<typeof satellite.twoline2satrec>[] = [];

    for (let i = 0; i < lines.length - 2; i += 3) {
      const line1 = lines[i + 1]?.trim();
      const line2 = lines[i + 2]?.trim();
      if (!line1 || !line2 || line1.length < 50 || line2.length < 50) continue;
      try { satRecs.push(satellite.twoline2satrec(line1, line2)); } catch { /* skip */ }
    }

    tleCache = { satRecs, fetchedAt: now };
    return satRecs;
  } catch (e) {
    console.error('Failed to read active.txt', e);
  }

  return tleCache?.satRecs ?? [];
}

function countOverheadSatellites(
  satRecs: ReturnType<typeof satellite.twoline2satrec>[],
  lat: number, lon: number
): number {
  const now = new Date();
  const gmst = satellite.gstime(now);
  const observerGd = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0,
  };
  let count = 0;
  for (const satrec of satRecs) {
    try {
      const pv = satellite.propagate(satrec, now);
      const pos = pv.position;
      if (typeof pos !== 'object') continue;
      const ecf = satellite.eciToEcf(pos, gmst);
      const angles = satellite.ecfToLookAngles(observerGd, ecf);
      if (angles.elevation > 0) count++;
    } catch { /* skip */ }
  }
  return count;
}

function calcOrbitalGriefIndex(
  cloudCover: number,
  moonPhaseDeg: number,
  satellitesOverhead: number
): number {
  // Moon brightness: 0 at new moon, 100 at full moon
  const moonBrightness = ((1 - Math.cos((moonPhaseDeg % 360) * Math.PI / 180)) / 2) * 100;
  // Satellite density: normalised to 0-100 (150 overhead ≈ max)
  const satScore = Math.min(100, (satellitesOverhead / 150) * 100);
  // Weighted score
  const ogi = (cloudCover * 0.45) + (moonBrightness * 0.35) + (satScore * 0.20);
  return Math.round(Math.min(100, ogi));
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lonStr = searchParams.get('lon');

  if (!latStr || !lonStr) {
    return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const now = Date.now();

  try {
    const [weatherRes, geocodeRes, satRecs] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,weather_code,visibility`,
        { next: { revalidate: 600 } }
      ).catch(() => null),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,
        {
          headers: { 'User-Agent': 'Zenith Observatory App/1.0' },
          next: { revalidate: 86400 },
        }
      ).catch(() => null),
      getSatRecs(),
    ]);

    const weatherData = weatherRes?.ok ? await weatherRes.json() : null;
    const geocodeData = geocodeRes?.ok ? await geocodeRes.json() : null;

    // Astronomy Engine
    const date = new Date();
    const observer = new Observer(lat, lon, 0);
    const moonPhaseValue = MoonPhase(date);

    const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
    const visiblePlanets = planets.filter(planet => {
      const body = Body[planet as keyof typeof Body];
      const equ = Equator(body, date, observer, true, true);
      const hor = Horizon(date, observer, equ.ra, equ.dec, 'normal');
      return hor.altitude > 0;
    });

    const cloudCover = weatherData?.current?.cloud_cover ?? 0;
    const satellitesOverhead = satRecs.length > 0
      ? countOverheadSatellites(satRecs, lat, lon)
      : 0;

    const orbitalGriefIndex = calcOrbitalGriefIndex(cloudCover, moonPhaseValue, satellitesOverhead);

    // Location details
    const addr = geocodeData?.address ?? {};
    const cityName = addr.city || addr.town || addr.village || addr.state || 'Unknown';
    const country = addr.country || '';

    // Insight
    let insight = `Current conditions above ${cityName}`;
    if (cloudCover > 70) {
      insight += ` suggest poor visibility due to heavy cloud cover (${cloudCover}%).`;
    } else if (visiblePlanets.length > 2) {
      insight += ` provide excellent planetary visibility — ${visiblePlanets.join(', ')} are above the horizon.`;
    } else if (orbitalGriefIndex < 20) {
      insight += ` offer a pristine dark sky tonight. Ideal conditions for observation.`;
    } else {
      insight += ` show ${cloudCover}% cloud cover with ${satellitesOverhead} satellites overhead.`;
    }

    return NextResponse.json({
      location: cityName,
      country,
      cloudCover,
      moonPhase: moonPhaseValue,
      visiblePlanets,
      satellitesOverhead,
      insight,
      skyQualityScore: Math.max(0, 100 - cloudCover),
      orbitalGriefIndex,
      timestamps: {
        weather: now,
        satellites: tleCache?.fetchedAt ?? now,
        celestial: now,
      },
    });
  } catch (error) {
    console.error('Telemetry error:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
