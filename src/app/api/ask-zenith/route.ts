import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing in the environment. Please add it to your .env.local file.' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { message, context, history } = await req.json();

    if (!message || !context) {
      return NextResponse.json({ error: 'Missing message or context payload' }, { status: 400 });
    }

    // Step A & B: Build structured observatory context for the LLM
    const { consoleMode, location, telemetry, satellite, activeLayers, issPass } = context;

    let systemContextText = `You are Zenith, a context-aware observatory assistant.
Your job is to act as a premium, calm, and precise Mission Console Analyst.
You MUST ONLY answer using the exact telemetry and data provided below.
DO NOT hallucinate external facts. DO NOT act like a general-purpose ChatGPT clone or broad astrophysics tutor.
If the user asks something outside this data (e.g., "explain black holes", "who discovered Saturn"), politely redirect them to what Zenith can actually help with (sky telemetry, orbital data, visible satellites).
When appropriate, use the provided heuristic data but frame it as an "informed Zenith interpretation" rather than sourced external metadata.

CURRENT OBSERVATORY STATE:
Mode: ${consoleMode}
Active Layers: ${Object.entries(activeLayers).filter(([_, active]) => active).map(([name]) => name).join(', ') || 'None'}
`;

    if (location && telemetry) {
      systemContextText += `
--- LOCATION DATA ---
Selected Location: ${location.name}, ${location.country} (Lat: ${location.lat}, Lon: ${location.lon})
Cloud Cover: ${telemetry.cloudCover}%
Sky Quality Score: ${telemetry.skyQualityScore}/100 (Higher is better)
Orbital Grief Index: ${telemetry.orbitalGriefIndex}/100 (Higher is worse, indicating more obstruction)
Visible Planets: ${telemetry.visiblePlanets?.join(', ') || 'None'}
Satellites Overhead: ${telemetry.satellitesOverhead}
`;
    }

    if (satellite) {
      systemContextText += `
--- SATELLITE DATA ---
Selected Satellite: ${satellite.name} (NORAD: ${satellite.id})
Category: ${satellite.category}
Altitude: ${satellite.altitudeKm?.toFixed(1)} km
Velocity: ${satellite.velocityKms?.toFixed(2)} km/s
Inclination: ${satellite.inclination?.toFixed(2)}°
`;

      // Provide heuristic interpretations based on category
      if (satellite.category === 'stations') {
        systemContextText += `Heuristic Role: Human Spaceflight & Orbital Outpost in vLEO.\n`;
      } else if (satellite.category === 'gps') {
        systemContextText += `Heuristic Role: Global Navigation Constellation (MEO).\n`;
      } else if (satellite.category === 'weather') {
        systemContextText += `Heuristic Role: Meteorological & Earth Observation.\n`;
      } else if (satellite.category === 'starlink') {
        systemContextText += `Heuristic Role: Broadband LEO Mega-Constellation for low-latency planetary comms.\n`;
      } else if (satellite.category === 'iridium') {
        systemContextText += `Heuristic Role: Satcom Relay Network utilizing inter-satellite links.\n`;
      }
    }

    if (issPass && issPass.nextPass) {
      const passDate = new Date(issPass.nextPass).toLocaleString();
      systemContextText += `
--- ISS PASS DATA ---
Next ISS Pass over selected location: ${passDate}
Max Elevation during pass: ${issPass.maxElevationDegrees}°
`;
    } else if (consoleMode === 'location' || consoleMode === 'iss') {
       systemContextText += `\n--- ISS PASS DATA ---\nNo ISS passes overhead within 24 hours.\n`;
    }

    // Prepare conversation history
    const contents = [];
    
    // Convert history format to Gemini format
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user') {
          contents.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'assistant') {
          contents.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }
    }

    // Append the current message
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Step C: Generate response via Gemini using the strictly bounded context
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: systemContextText,
        temperature: 0.2, // Keep it deterministic and precise
      }
    });

    const reply = response.text;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Ask Zenith API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
