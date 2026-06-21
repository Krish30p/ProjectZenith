import { NextResponse } from 'next/server';
import { Observer, MoonPhase, Body, Equator, Horizon } from 'astronomy-engine';
import * as satellite from 'satellite.js';
import { promises as fs } from 'fs';
import path from 'path';

// ─── TLE Cache (SWR Pattern) ───────────────────────────────────────────────────
interface TleCache {
  satRecs: ReturnType<typeof satellite.twoline2satrec>[];
  fetchedAt: number;
}
let tleCache: TleCache | null = null;
let activeRefresh: Promise<void> | null = null;

async function refreshActiveSatRecs() {
  const url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';
  const now = Date.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 43200 }, // 12 hours
    });
    if (!res.ok) throw new Error(`CelesTrak active fetch failed: ${res.status}`);

    const text = await res.text();
    const lines = text.split(/\r?\n/);
    const satRecs: ReturnType<typeof satellite.twoline2satrec>[] = [];

    for (let i = 0; i < lines.length - 2; i += 3) {
      const line1 = lines[i + 1]?.trim();
      const line2 = lines[i + 2]?.trim();
      if (!line1 || !line2 || line1.length < 50 || line2.length < 50) continue;
      try { satRecs.push(satellite.twoline2satrec(line1, line2)); } catch { /* skip */ }
    }

    tleCache = { satRecs, fetchedAt: now };
    console.log('[Telemetry API] Successfully fetched live CelesTrak active catalogue.');
  } catch (error) {
    console.warn('[Telemetry API] Live fetch failed for active group. Falling back to active.txt.', error);
    if (tleCache) return; // Keep existing cache if we have one

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
    } catch (fsErr) {
      console.error('Failed to read active.txt', fsErr);
    }
  }
}

async function getSatRecs() {
  const isStale = !tleCache || (Date.now() - tleCache.fetchedAt > 12 * 60 * 60 * 1000); // 12h TTL

  // If we have cache and it's stale, start background refresh but serve cached immediately
  if (tleCache && isStale && !activeRefresh) {
    activeRefresh = refreshActiveSatRecs().finally(() => { activeRefresh = null; });
  }

  // If we have no cache, we MUST await the refresh
  if (!tleCache) {
    if (!activeRefresh) {
      activeRefresh = refreshActiveSatRecs().finally(() => { activeRefresh = null; });
    }
    await activeRefresh;
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
    const [weatherRes, geocodeRes, geocodeEnRes, satRecs] = await Promise.all([
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=cloud_cover,weather_code,visibility&timezone=auto`,
        { next: { revalidate: 600 } }
      ).catch(() => null),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`,
        {
          headers: { 'User-Agent': 'Zenith Observatory App/1.0' },
          next: { revalidate: 86400 },
        }
      ).catch(() => null),
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=en`,
        {
          headers: { 'User-Agent': 'Zenith Observatory App/1.0' },
          next: { revalidate: 86400 },
        }
      ).catch(() => null),
      getSatRecs(),
    ]);

    const weatherData = weatherRes?.ok ? await weatherRes.json() : null;
    const geocodeData = geocodeRes?.ok ? await geocodeRes.json() : null;
    const geocodeEnData = geocodeEnRes?.ok ? await geocodeEnRes.json() : null;

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
    const visibilityMeters = weatherData?.current?.visibility;
    const visibilityKm = visibilityMeters !== undefined ? Math.round(visibilityMeters / 1000) : undefined;
    const timezone = weatherData?.timezone;
    const timezoneAbbr = weatherData?.timezone_abbreviation;
    const satellitesOverhead = satRecs.length > 0
      ? countOverheadSatellites(satRecs, lat, lon)
      : 0;

    const orbitalGriefIndex = calcOrbitalGriefIndex(cloudCover, moonPhaseValue, satellitesOverhead);

    // ─── Bilingual Location Names ────────────────────────────────────────────
    const addrNative = geocodeData?.address ?? {};
    const addrEn = geocodeEnData?.address ?? {};

    const nativeName = addrNative.city || addrNative.town || addrNative.village || addrNative.state || '';
    const englishName = addrEn.city || addrEn.town || addrEn.village || addrEn.state || '';
    const nativeCountry = addrNative.country || '';
    const englishCountry = addrEn.country || '';

    // Determine if scripts differ (simple heuristic: check if strings are identical)
    const isLatinScript = (s: string) => /^[\x00-\x7F\u00C0-\u024F\u1E00-\u1EFF]+$/.test(s.replace(/[\s\-().,']/g, ''));

    const cityName = englishName || nativeName || 'Unknown';
    const cityNameNative = (nativeName && nativeName !== englishName && !isLatinScript(nativeName))
      ? nativeName
      : undefined;

    const country = englishCountry || nativeCountry || '';
    const countryNative = (nativeCountry && nativeCountry !== englishCountry && !isLatinScript(nativeCountry))
      ? nativeCountry
      : undefined;

    // Advanced Sky Quality Score
    const moonBrightness = ((1 - Math.cos((moonPhaseValue % 360) * Math.PI / 180)) / 2) * 100;
    const visibilityPenalty = visibilityKm !== undefined ? Math.max(0, 100 - (visibilityKm * 5)) : 0; // Assume 20km is perfect visibility
    const baseScore = 100 - cloudCover;
    let skyQualityScore = baseScore - (moonBrightness * 0.2) - visibilityPenalty;
    skyQualityScore = Math.round(Math.max(0, Math.min(100, skyQualityScore)));

    // Insight
    let insight = `Current conditions above ${cityName}`;
    if (cloudCover > 70) {
      insight += ` suggest poor visibility due to heavy cloud cover (${cloudCover}%).`;
    } else if (visiblePlanets.length > 2) {
      insight += ` provide excellent planetary visibility — ${visiblePlanets.join(', ')} are above the horizon.`;
    } else if (orbitalGriefIndex < 20 && skyQualityScore > 80) {
      insight += ` offer a pristine dark sky tonight. Ideal conditions for observation.`;
    } else {
      insight += ` show ${cloudCover}% cloud cover with ${satellitesOverhead} satellites overhead.`;
    }

    return NextResponse.json({
      location: cityName,
      locationNative: cityNameNative ?? undefined,
      country,
      countryNative: countryNative ?? undefined,
      cloudCover,
      visibilityKm,
      timezone,
      timezoneAbbr,
      moonPhase: moonPhaseValue,
      visiblePlanets,
      satellitesOverhead,
      insight,
      skyQualityScore,
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
