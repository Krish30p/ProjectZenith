<div align="center">

# 🛰️ Zenith — The Celestial Eye

### A Real-Time Interactive Orbital Observatory for Earth, Sky, and Satellite Intelligence

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

**Zenith** lets you explore what's happening above *any* location on Earth — right now — through a cinematic 3D globe, live satellite tracking, sky-condition intelligence, and orbital congestion analytics.

[Live Demo](#) 

</div>

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Why Zenith](#why-zenith)
- [Core Features](#core-features)
- [Hackathon Requirements Mapping](#hackathon-requirements-mapping)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Real-Time Data Sources](#real-time-data-sources)
- [Data Pipeline](#data-pipeline)
- [Responsive Design Strategy](#responsive-design-strategy)
- [Performance & Refresh Strategy](#performance--refresh-strategy)
- [Roadmap](#roadmap)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Zenith — The Celestial Eye** is a real-time interactive orbital observatory built to answer one core question:

> **What is happening in the sky above any place on Earth right now?**

With Zenith you can:

- Interact with a fully navigable **3D globe**
- Click or search **any location on Earth**
- Inspect **real-time sky conditions** (cloud cover, visibility, moon phase, visible planets)
- Track **live orbital satellites** by category (ISS, GPS, weather, Starlink, Iridium)
- Monitor **ISS position and upcoming passes**
- Visualize **orbital congestion / traffic density** across the planet

Rather than presenting raw API responses on a plain dashboard, Zenith turns celestial and orbital data into an immersive, mission-control-style observatory experience.

## Problem Statement

The night sky above us is shaped by several independent layers of information: weather and cloud cover, moon phase and visibility, visible planets, satellite traffic, ISS overhead passes, and the growing congestion caused by modern satellite constellations.

Most existing tools surface only **one layer at a time** — weather, astronomy, *or* satellites. Zenith unifies all of them into a single interactive platform, so a user can explore both:

1. **What a person can observe** from a given location, and
2. **What is happening in orbit** above that location.

## Why Zenith

| | |
|---|---|
| 🌍 **Interactive 3D Earth observatory** | Powered by `react-globe.gl` / Three.js |
| 🌦️ **Location-based sky intelligence** | Live weather + astronomy context per coordinate |
| 🛰️ **Real-time satellite & ISS tracking** | Multiple orbital categories, live propagation |
| 🔥 **Orbital Lens** | Congestion / density heatmap of orbital traffic |
| 🎬 **Mission-style UI** | Cosmic storytelling and observatory theming |
| 📱 **Fully responsive** | Desktop, tablet, and mobile layouts |
| ⚡ **Single-app architecture** | One Next.js + TypeScript codebase, no separate backend |

## Core Features

### 1. Launch Observatory — Interactive 3D Globe
A full-screen 3D globe where users can rotate and zoom around Earth, click any coordinate, search a city/region/landmark, switch between orbital layers, and open different observatory intelligence modes. This is the main entry point into the experience.

### 2. Location Intelligence / Celestial Atlas
Selecting a location generates a location-specific observatory profile, including city/country/region, lat/lon, timezone and local time, cloud cover, visibility, moon phase, visible planets, a sky quality score, orbital congestion context, satellites overhead, and the next ISS pass for that place.

### 3. Real-Time Satellite Tracking
Inspect orbital categories — **Stations/ISS, GPS/Navigation, Weather Satellites, Starlink, Iridium** — with telemetry including name + NORAD ID, live propagated lat/lon, altitude, velocity, inclination, TLE epoch/freshness, and observability status.

### 4. ISS Mission Mode
A dedicated tracking experience showing live ISS position, orbital state, altitude and velocity, and pass predictions for a selected location.

### 5. Orbital Lens — Space Congestion Heatmap
Visualizes orbital traffic *density* across Earth (rather than isolated satellite markers) to help answer: **where is orbital space currently most crowded?** Highlights dense orbital corridors and how congestion shifts at a planetary scale.

### 6. Cosmic Time Machine
A narrative visualization module contrasting quieter historical orbital eras with the modern orbital boom and projected future congestion — giving Zenith both operational and educational value.

## Capabilities at a Glance

| Requirement | How Zenith Satisfies It |
|---|---|
| **Functional interactive map / 3D globe** capturing user-selected coordinates | Full-screen 3D globe with click-to-select coordinates and location search |
| **Dynamic display of celestial bodies** above the selected location | Live weather, visibility, moon phase, visible planets, ISS position/passes, and orbital traffic layers, all recomputed per location |
| **Advanced responsive CSS** (Grid/Flexbox) across devices | CSS Grid, Flexbox, and Tailwind responsive breakpoints with adaptive overlays/panels for mobile, tablet, and desktop |
| **Feature richness / creative extras** (orbit paths, speed trackers, constellation overlays) | Satellite tracking, ISS pass intelligence, Orbital Lens congestion heatmap, sky observability metrics, and the Cosmic Time Machine storytelling module |
| **Code structure & documentation** | Modular Next.js app with feature-based components, typed route handlers, reusable utilities, and this README |

## Tech Stack

**Frontend**
- Next.js (App Router) · React · TypeScript · Tailwind CSS · Framer Motion · `react-globe.gl` (Three.js)

**Data / Orbital / Astronomy Layer**
- `satellite.js` · Astronomy Engine · custom telemetry aggregation utilities

**Backend**
- Implemented entirely as Next.js Route Handlers with server-side utilities and in-app caching/refresh logic — **no separate Python/FastAPI backend**.

## Architecture

Zenith is intentionally built as a single-app observatory platform:

```text
User interacts with Zenith
   ↓
3D Globe / Search / Observatory controls
   ↓
Location selection or satellite selection
   ↓
Next.js route handlers fetch & aggregate live data from:
   - CelesTrak
   - Open-Meteo
   - Nominatim
   - Astronomy Engine
   ↓
Data is normalized into observatory telemetry payloads
   ↓
Zenith renders feature-specific UI:
   - Location Atlas
   - Satellite Mode
   - ISS Mode
   - Orbital Lens
   - Time Machine
```

**Feature walkthrough**

- **Landing Experience** — introduces Zenith's identity and the Cosmic Time Machine, with entry into the Launch Observatory.
- **Launch Observatory** — full-screen mode with the 3D globe, search, layer toggles, satellite markers, and mission console overlays.
- **Location selection flow** — click/search a place → Zenith captures coordinates → resolves name + telemetry → observatory UI updates.
- **Satellite selection flow** — select an orbital object → switch to satellite telemetry mode → display live propagated orbital state.
- **Orbital Lens flow** — activate the lens → compute congestion patterns → render heatmap overlays.

## Project Structure

> File names may evolve during UI refactors, but the structure stays organized around observatory features and route-level data fetching.

```text
ProjectZenith/
├── public/                          # Static assets (textures, images)
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── api/                     # Backend API routes
│   │   │   ├── iss/                 # Live ISS position endpoint
│   │   │   ├── iss-pass/            # Custom ISS prediction engine
│   │   │   ├── satellites/          # CelesTrak TLE fetching & parsing
│   │   │   └── telemetry/           # Open-Meteo & Astronomy Engine aggregator
│   │   ├── observatory/             # Main Observatory route
│   │   │   └── page.tsx
│   │   ├── layout.tsx               # Root layout & global providers
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── observatory/             # Core observatory features
│   │   │   ├── CosmicBookOverlay.tsx   # Location Atlas ("physical book" UI)
│   │   │   ├── GlobeViewer.tsx         # 3D react-globe.gl component
│   │   │   ├── IntelligencePanel.tsx   # Telemetry data & insights panel
│   │   │   ├── LocationSearch.tsx      # Nominatim search component
│   │   │   ├── ObservatoryClient.tsx   # Main observatory hub & Orbital Lens
│   │   │   └── OrbitalGriefGauge.tsx   # Orbital congestion gauge
│   │   ├── time-machine/            # Cosmic Time Machine components
│   │   ├── dashboard/                # Dashboard components
│   │   ├── TheSkyWeLost.tsx          # Landing page storytelling section
│   │   ├── HeroSection.tsx           # Landing page hero
│   │   └── Navbar.tsx                # Global navigation
│   └── lib/
│       ├── config.ts                 # Environment variable validation (Zod)
│       ├── satellites.ts             # Satellite math, categorization & TLE logic
│       ├── timeMachineData.ts        # Time Machine narrative data
│       └── utils.ts                  # General utilities
├── .env.local                        # Environment variables (not committed)
├── next.config.ts                    # Next.js + Webpack configuration
├── package.json                      # Dependencies & scripts
└── tsconfig.json                     # TypeScript configuration
```

## Quick Start

### Prerequisites

| Tool | Version |
|---|---|
| [Node.js](https://nodejs.org/) | v18.x or higher |
| npm | v9.x or higher (bundled with Node.js) |
| [Git](https://git-scm.com/) | latest |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/khrisha29/ProjectZenith.git
cd ProjectZenith

# 2. Install dependencies
npm install

# 3. Configure environment variables (see below)
cp .env.example .env.local   # or create .env.local manually

# 4. Run the dev server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## Environment Variables

Create a `.env.local` file in the project root. No API keys are committed to this repository — only the variable names required are documented here.

```env
# Required — Cesium Ion Token for the 3D globe
# Get one free at: https://ion.cesium.com/
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token

# Optional — NASA API Key (reserved for future features)
# Get one at: https://api.nasa.gov/
# NASA_API_KEY=your_nasa_api_key

# Pre-configured — do not change
OPEN_METEO_BASE_URL=https://api.open-meteo.com
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
CELESTRAK_BASE_URL=https://celestrak.org
```

**Getting a Cesium Ion token:**
1. Go to [ion.cesium.com](https://ion.cesium.com/) and create a free account.
2. Navigate to **Access Tokens** in the sidebar.
3. Click **Create Token**, then copy it into `NEXT_PUBLIC_CESIUM_ION_TOKEN`.

## API Routes

| Route | Description |
|---|---|
| `GET /api/telemetry` | Location-based observatory intelligence: cloud cover, visibility, moon phase, visible planets, sky quality, orbital observability metrics |
| `GET /api/iss` | Live ISS position and orbital telemetry |
| `GET /api/iss-pass` | ISS pass prediction for a selected location |
| `GET /api/satellites/[category]` | Satellite category datasets — `stations`, `gps`, `weather`, `starlink`, `iridium` |

## Real-Time Data Sources

| Source | Used For |
|---|---|
| **[CelesTrak](https://celestrak.org/)** | Satellite category feeds, TLE/orbital element sets, ISS orbital projection data — powers live propagation, the custom ISS prediction engine, and orbital visualization |
| **[Open-Meteo](https://open-meteo.com/)** | Cloud cover, visibility, and timezone-related context — determines whether the sky is actually viewable from a location |
| **[Nominatim](https://nominatim.openstreetmap.org/) / OpenStreetMap** | Reverse geocoding — converts coordinates into human-readable place, city, country, and region names |
| **[Astronomy Engine](https://github.com/cosinekitty/astronomy)** | Moon phase, illumination, and visible-planet calculations based on observer coordinates |
| **`react-globe.gl`** (Three.js) | The interactive 3D globe, geospatial rendering, and camera navigation |
| **Custom ISS Pass Engine** (`satellite.js`) | Native 24-hour orbital projection engine built in-house — avoids rate-limited third-party APIs like Open Notify by computing overhead ISS passes server-side from CelesTrak TLE data |

> Additional services may be integrated as the project grows, but the above are the primary engines powering the current Zenith stack.

## Data Pipeline

1. **User selects a location** — clicks a coordinate or searches for a place.
2. **Zenith resolves place + sky context** — route handlers fetch location metadata from Nominatim, weather/visibility from Open-Meteo, celestial context from Astronomy Engine, and ISS/orbital context where relevant.
3. **Zenith builds a telemetry payload** — a single object containing place info, coordinates, timezone/local time, cloud cover, visibility, moon phase, visible planets, sky quality signals, and orbital/ISS context.
4. **Frontend renders the observatory UI** — the payload populates the Location Atlas, ISS/Satellite mode, or Orbital Lens overlays, depending on the active mode.

## Responsive Design Strategy

| Breakpoint | Behavior |
|---|---|
| **Desktop** | Full-screen 3D globe with rich, multi-zone side panels and overlays |
| **Tablet** | Reduced spacing and rebalanced panels while preserving observatory hierarchy |
| **Mobile** | Adaptive overlays/sheets, vertically stacked intelligence layouts, touch-friendly controls and search |

**Layout techniques:** Flexbox, CSS Grid, responsive Tailwind breakpoints, and conditional rendering for stacked UI zones on smaller screens.

## Performance & Refresh Strategy

- Feature-based UI separation and selective satellite-layer rendering
- Cached / revalidated orbital datasets
- Client-side orbital propagation instead of constant full-server recomputation
- Route-level fetching for observatory data
- Refresh intervals tuned per data type:

| Signal | Refresh Cadence |
|---|---|
| ISS position | Frequent |
| Weather / cloud cover | Moderate |
| Moon phase / visible planets | Slow |
| TLE / satellite layer datasets | Cached, periodic |

## Roadmap

- [ ] Constellation overlays
- [ ] Side-by-side location sky comparison
- [ ] Orbital history playback
- [ ] Aurora / meteor shower awareness
- [ ] Saved observatory locations
- [ ] Public observatory event / educational mode

## Screenshots

> Add screenshots or a GIF walkthrough for each mode below.

| Landing Page | Launch Observatory |
|---|---|
| <img width="947" height="437" alt="image" src="https://github.com/user-attachments/assets/039e5d47-2e1b-4c0f-8f24-99cd819c66be" /> |
 | <img width="959" height="436" alt="image" src="https://github.com/user-attachments/assets/bb3e75e4-c1d3-4360-9a86-57569b4e8212" /> |
 
| Location Atlas | Orbital Lens |
|---|---|
| _add screenshot_ | _add screenshot_ |

| Satellite / ISS Mode | Feature section |
|---|---|
| _add screenshot_ | _add screenshot_ |

**Demo link:** _[Add your live demo URL here]_

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## License

This project is intended for educational / hackathon purposes unless otherwise specified. If you plan to open-source it publicly, consider adding a standard license such as **MIT**.

---

<div align="center">
Built with 🛰️ and ☕ for exploring what's above us.
</div>
