import { NextResponse } from 'next/server';
import { SatelliteCategory, TleData, LayerPayload } from '@/lib/satellites';
import fs from 'fs';
import path from 'path';

const CATEGORY_MAP: Record<string, { group: string; revalidate: number }> = {
  stations: { group: 'stations', revalidate: 21600 },
  starlink: { group: 'starlink', revalidate: 21600 },
  gps: { group: 'gps-ops', revalidate: 43200 },
  weather: { group: 'weather', revalidate: 43200 },
  iridium: { group: 'iridium', revalidate: 43200 },
};

function parseEpoch(line1: string): number {
  try {
    let year = parseInt(line1.substring(18, 20), 10);
    year += (year < 57) ? 2000 : 1900;
    const days = parseFloat(line1.substring(20, 32));
    const date = new Date(Date.UTC(year, 0, 1));
    date.setUTCMilliseconds((days - 1) * 24 * 60 * 60 * 1000);
    return date.getTime();
  } catch {
    return 0;
  }
}

// Persistent memory cache
const memoryCache = new Map<string, LayerPayload>();

// Single-flight refresh locks
const activeRefreshes = new Map<string, Promise<void>>();

async function refreshLayer(category: string) {
  const { group } = CATEGORY_MAP[category];
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`;
  const now = Date.now();

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      // We still let Next.js cache the fetch, but we manage our own memory cache for the SWR pattern
      next: { revalidate: CATEGORY_MAP[category].revalidate },
    });

    if (!res.ok) throw new Error(`CelesTrak API error: ${res.status}`);

    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsedData: TleData[] = [];

    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 >= lines.length) break;
      const name = lines[i].replace(/^0 /, '');
      const tle1 = lines[i + 1];
      const tle2 = lines[i + 2];
      const noradId = tle1.substring(2, 7).trim();

      parsedData.push({
        id: noradId,
        name,
        category: category as SatelliteCategory,
        tleLine1: tle1,
        tleLine2: tle2,
        tleEpoch: parseEpoch(tle1),
        fetchedAt: now,
      });
    }

    memoryCache.set(category, {
      category: category as SatelliteCategory,
      source: 'live-celestrak',
      fetchedAt: now,
      satellites: parsedData,
    });

    console.log(`[Satellite API] Refreshed ${category} from live CelesTrak.`);
  } catch (error) {
    console.warn(`[Satellite API] Live fetch failed for ${category}. Reason:`, error);

    // If we already have something in memory (even a fallback), we preserve it rather than overwriting
    if (memoryCache.has(category)) {
      console.log(`[Satellite API] Keeping existing cache for ${category} after live fetch failure.`);
      return;
    }

    // Only fallback to reading active.txt if our memory cache is completely empty
    try {
      const activePath = path.join(process.cwd(), 'active.txt');
      if (fs.existsSync(activePath)) {
        const text = fs.readFileSync(activePath, 'utf8');
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const parsedData: TleData[] = [];

        for (let i = 0; i < lines.length; i += 3) {
          if (i + 2 >= lines.length) break;
          const name = lines[i].replace(/^0 /, '');
          const upperName = name.toUpperCase();

          let match = false;
          if (category === 'stations' && (upperName.includes('ISS') || upperName.includes('CSS'))) match = true;
          else if (category === 'starlink' && upperName.includes('STARLINK')) match = true;
          else if (category === 'gps' && (upperName.includes('NAVSTAR') || upperName.includes('GPS'))) match = true;
          else if (category === 'weather' && (upperName.includes('NOAA') || upperName.includes('METEOR') || upperName.includes('GOES'))) match = true;
          else if (category === 'iridium' && upperName.includes('IRIDIUM')) match = true;

          if (match) {
            const tle1 = lines[i + 1];
            const tle2 = lines[i + 2];
            const noradId = tle1.substring(2, 7).trim();
            parsedData.push({
              id: noradId,
              name,
              category: category as SatelliteCategory,
              tleLine1: tle1,
              tleLine2: tle2,
              tleEpoch: parseEpoch(tle1),
              fetchedAt: now,
            });
          }
        }

        memoryCache.set(category, {
          category: category as SatelliteCategory,
          source: 'local-fallback',
          fetchedAt: now,
          satellites: parsedData,
        });

        console.log(`[Satellite API] Parsed local-fallback active.txt for ${category}.`);
      }
    } catch (fsErr) {
      console.error('[Satellite API] active.txt fallback failed:', fsErr);
    }
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const { category } = await params;

  if (!CATEGORY_MAP[category]) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  // 1. If we have it in memory cache, serve it immediately (SWR pattern)
  if (memoryCache.has(category)) {
    const cached = memoryCache.get(category)!;

    // Kick off a background refresh if it's stale (older than 1 minute) and not already refreshing
    const isStale = Date.now() - cached.fetchedAt > 60000;
    if (isStale && !activeRefreshes.has(category)) {
      const refreshPromise = refreshLayer(category).finally(() => activeRefreshes.delete(category));
      activeRefreshes.set(category, refreshPromise);
    }

    // Truthfully report the source (a cached live response is reported as "cached-celestrak")
    const payloadToReturn: LayerPayload = {
      ...cached,
      source: cached.source === 'live-celestrak' ? 'cached-celestrak' : cached.source,
    };

    return NextResponse.json(payloadToReturn);
  }

  // 2. Cache is empty. We MUST await a refresh to return anything.
  if (!activeRefreshes.has(category)) {
    const refreshPromise = refreshLayer(category).finally(() => activeRefreshes.delete(category));
    activeRefreshes.set(category, refreshPromise);
  }

  await activeRefreshes.get(category);

  const finalPayload = memoryCache.get(category);
  if (!finalPayload) {
    return NextResponse.json({ error: 'Failed to fetch satellite layer' }, { status: 500 });
  }

  return NextResponse.json(finalPayload);
}
