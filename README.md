# Zenith — The Celestial Eye

### A Real-Time Interactive Orbital Observatory for Earth, Sky, and Satellite Intelligence

> **Zenith** is a real-time celestial observatory that allows users to explore **what is happening above any location on Earth** through a cinematic 3D globe, live satellite tracking, sky-condition intelligence, and orbital analytics.
> It blends **astronomy, geospatial interaction, and orbital awareness** into a single observatory experience.

---

# Overview

**Zenith — The Celestial Eye** is a **real-time interactive orbital observatory** built to answer one core question:

> **What is happening in the sky above any place on Earth right now?**

Zenith allows a user to:

* interact with a **3D globe**
* click or search **any location on Earth**
* inspect **real-time sky conditions**
* view **visible celestial objects**
* track **live orbital satellites**
* monitor **ISS position and passes**
* understand **orbital congestion / traffic density**
* explore all of this through a **cinematic, space-themed observatory interface**

Rather than presenting raw API responses in a plain dashboard, Zenith transforms celestial and orbital data into an immersive **mission-control observatory experience**.

---

# Problem Statement

The night sky above us is influenced by multiple layers of information:

* weather and cloud cover
* moon phase and visibility
* visible planets
* satellite traffic
* ISS overhead passes
* orbital congestion caused by modern constellations

Most existing tools focus on **only one layer** at a time — weather, astronomy, or satellites.
**Zenith** unifies these dimensions into one interactive platform so a user can explore both:

1. **What a person can observe from a location**
2. **What is happening in orbit above that location**

---

# Project Highlights

## What makes Zenith special

* **Interactive 3D Earth observatory** powered by Cesium
* **Location-based sky intelligence** using live weather + astronomy context
* **Real-time satellite and ISS tracking**
* **Orbital Lens**: congestion / density visualization for orbital traffic
* **Premium mission-style UI** with cosmic storytelling and observatory theming
* **Responsive design** for desktop, tablet, and mobile
* **Single-app architecture** built entirely in **Next.js + TypeScript**

---

# Core Features

## 1) Launch Observatory — Interactive 3D Globe

Zenith’s core interface is a **full-screen 3D globe** where the user can:

* rotate and zoom around Earth
* click on any coordinate to inspect that location
* search for a city / region / landmark
* switch between orbital layers
* open different observatory intelligence modes

This globe acts as the main entry point into the entire observatory experience.

---

## 2) Location Intelligence / Celestial Atlas

When a location is selected, Zenith generates a **location-specific observatory profile**.

### It can display:

* city / country / region
* latitude / longitude
* timezone + local time
* cloud cover
* visibility
* moon phase
* visible planets
* sky quality score
* orbital grief / orbital congestion context
* satellites overhead
* next ISS pass for the selected place

This transforms a simple map click into a **live observatory report** for that location.

---

## 3) Real-Time Satellite Tracking

Zenith supports orbital inspection of multiple satellite categories, such as:

* **Stations / ISS**
* **GPS / Navigation**
* **Weather Satellites**
* **Starlink**
* **Iridium Communications**

### Satellite telemetry can include:

* name + NORAD ID
* live propagated latitude / longitude
* altitude
* velocity
* inclination
* TLE epoch / freshness metadata
* source status / observability context

---

## 4) ISS Mission Mode

Zenith includes a dedicated ISS tracking experience with:

* live ISS position
* orbital state
* altitude and velocity
* pass prediction for a selected location
* contextual observatory display when the ISS is the selected target

---

## 5) Orbital Lens — Space Congestion Heatmap

Orbital Lens is Zenith’s global congestion visualization layer.

Instead of only showing individual satellites as isolated markers, it visualizes **orbital traffic density** across Earth to help answer:

> **Where is orbital space currently most crowded?**

This helps users understand:

* dense orbital corridors
* regions with high satellite overhead activity
* how orbital congestion changes visually at a planetary scale

---

## 6) Sky Window

Sky Window is a dedicated observatory experience focused on the **human-facing sky above a chosen location**.

It is designed to answer:

* What does the sky above this place look like right now?
* What planets may be visible?
* What is the moon phase here?
* Are the conditions good for observation?
* Is an ISS pass expected?

---

## 7) Cosmic Time Machine

Cosmic Time Machine is Zenith’s narrative visualization module that explores how orbital traffic has evolved across time.

It is designed as a storytelling layer that contrasts:

* earlier, quieter orbital eras
* the modern orbital boom
* projected future congestion scenarios

This gives Zenith both **live operational value** and **educational / awareness impact**.

---

# How It Meets the Hackathon Requirements

## 1) Interactivity — Functional Interactive Map / 3D Globe

Zenith includes a **fully interactive 3D globe** that:

* captures user-selected coordinates
* supports location search
* dynamically updates observatory intelligence for that location

This directly satisfies the requirement for:

> **“A functional interactive map or 3D globe that captures user-selected coordinates.”**

---

## 2) Real-Time Data Fetching

Zenith dynamically fetches and computes live celestial/orbital context for the selected location.

### Examples of live / near-live information shown:

* weather and cloud cover
* visibility
* timezone / local time
* moon phase
* visible planets
* ISS position and pass predictions
* live orbital traffic layers
* propagated satellite telemetry

This satisfies the requirement for:

> **“Dynamic display of celestial bodies currently above the selected geographic location.”**

---

## 3) Responsive UI

Zenith is designed using **modern responsive layout techniques** and adapts across:

* **desktop**
* **tablet**
* **mobile**

The project uses:

* **CSS Grid**
* **Flexbox**
* **responsive Tailwind utilities**
* adaptive overlays / panels / stacked content layouts

This directly addresses:

> **“Application must use advanced CSS (Grid/Flexbox) to ensure a high-quality experience on mobile, tablet, and desktop.”**

---

## 4) Feature Richness

Zenith goes beyond a simple location weather panel by including:

* real-time satellite tracking
* ISS pass intelligence
* orbital congestion heatmaps
* location-based sky observability metrics
* mission-style celestial dashboards
* immersive storytelling modules like Cosmic Time Machine

This aligns strongly with the evaluation criterion for:

> **creative extras such as orbit paths, speed trackers, or constellation overlays**

---

## 5) Code Structure & Documentation

The application is structured as a **modular Next.js project** with:

* feature-based components
* route handlers for real-time APIs
* reusable observatory utilities
* typed payloads / contracts
* a dedicated README explaining setup, APIs, architecture, and features

---

# Real-Time Data Sources

Zenith combines multiple real-time and derived sources to build a complete observatory experience.

## 1. CelesTrak

Used for:

* satellite category feeds
* TLE/orbital element sets
* orbital layers such as stations, GPS, weather, Starlink, and Iridium
* live ISS orbital projection data

**Purpose:** Enables live satellite propagation, our custom native ISS prediction engine, orbital visualization, and satellite-layer rendering.

---

## 2. Open-Meteo

Used for:

* cloud cover
* visibility
* weather observability inputs
* timezone-related support for selected locations

**Purpose:** Helps determine whether the sky is actually viewable from a location.

---

## 3. Nominatim / OpenStreetMap Reverse Geocoding

Used for:

* converting coordinates into human-readable place names
* resolving city / country / region information for clicked locations

---

## 4. Astronomy Engine

Used for:

* moon phase and illumination logic
* visible planet calculations
* astronomy-based sky context for selected locations

---

## 5. react-globe.gl (Three.js)

Used for:

* the interactive 3D globe
* geospatial rendering and camera navigation
* immersive Earth-based observatory visualization


---

# Tech Stack

## Frontend

* **Next.js (App Router)**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Framer Motion**
* **react-globe.gl (Three.js)**

## Data / Orbital / Astronomy Layer

* **satellite.js**
* **Astronomy Engine**
* custom telemetry aggregation utilities

## Backend Layer

Zenith is implemented as a **single Next.js application** using:

* **Next.js Route Handlers**
* server-side utility functions
* caching / refresh logic within the app

> No separate Python/FastAPI backend is used in the final architecture.

---

# Architecture Overview

Zenith is intentionally built as a **single-app observatory platform**.

## High-Level Flow

```text
User interacts with Zenith
   ↓
3D Globe / Search / Observatory controls
   ↓
Location selection or satellite selection
   ↓
Next.js route handlers fetch / aggregate live data from:
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
   - Sky Window
   - Time Machine

```

---

# Feature Walkthrough

## A. Landing Experience

The landing page introduces Zenith’s cosmic identity and narrative layers, including the **Cosmic Time Machine** and entry into the **Launch Observatory**.

---

## B. Launch Observatory

The user enters a full-screen observatory mode with:

* the interactive 3D globe
* search
* layer toggles
* satellite markers
* mission console panels / overlays

---

## C. Location Selection Flow

1. User clicks a location or searches for one
2. Zenith captures the coordinates
3. Zenith resolves the location name and telemetry
4. Observatory UI updates with sky and orbital intelligence for that place

---

## D. Satellite Selection Flow

1. User selects a satellite / orbital object
2. Zenith switches into satellite-specific telemetry mode
3. Live propagated orbital state is displayed

---

## E. Orbital Lens Flow

1. User activates Orbital Lens
2. Zenith computes / visualizes orbital congestion patterns
3. Heatmap overlays help users understand where orbital traffic is dense

---

# Project Structure

> The exact file names may evolve during UI refactors, but the structure is organized around observatory features and route-level data fetching.


ProjectZenith/
├── public/                     # Static assets (textures, images)
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── api/                # Backend API Routes
│   │   │   ├── iss-pass/       # Custom ISS prediction engine
│   │   │   ├── satellites/     # CelesTrak TLE fetching & parsing
│   │   │   └── telemetry/      # Open-Meteo & Astronomy Engine aggregator
│   │   ├── observatory/        # Main Observatory route
│   │   │   └── page.tsx
│   │   ├── sky-window/         # Standalone Sky Window route
│   │   │   └── page.tsx
│   │   ├── layout.tsx          # Root layout & global providers
│   │   └── page.tsx            # Landing page
│   ├── components/             # React Components
│   │   ├── observatory/        # Core Observatory Features
│   │   │   ├── CosmicBookOverlay.tsx  # Location Atlas (Physical Book UI)
│   │   │   ├── GlobeViewer.tsx        # 3D react-globe.gl component
│   │   │   ├── IntelligencePanel.tsx  # Telemetry data & insights panel
│   │   │   ├── LocationSearch.tsx     # Nominatim search component
│   │   │   ├── ObservatoryClient.tsx  # Main Observatory hub & Orbital Lens
│   │   │   └── SkyWindowClient.tsx    # Sky Window Rooftop Observatory UI
│   │   ├── TheSkyWeLost.tsx    # Landing page storytelling section
│   │   ├── HeroSection.tsx     # Landing page hero
│   │   └── Navbar.tsx          # Global navigation
│   └── lib/                    # Core Utilities
│       └── satellites.ts       # Satellite math, categorization & TLE logic
├── .env.local                  # Environment variables
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies & scripts
└── tailwind.config.ts          # Styling design system


---

# API Routes

## `/api/telemetry`

Returns location-based observatory intelligence such as:

* cloud cover
* visibility
* moon phase
* visible planets
* sky quality context
* orbital observability metrics
* place-based sky data for the selected coordinates

---

## `/api/iss-pass`

Returns ISS pass prediction data for a selected location.

---

## `/api/satellites/[category]`

Returns satellite category datasets for layers such as:

* stations
* GPS
* weather
* Starlink
* Iridium

---

# Environment Variables / API Services Used

> **Important:** This project does **not** expose API keys in the repository.
> Only the **names of services / tokens required** are documented below.

## Environment Variables

Create a `.env.local` file in the project root.

### Required

```env
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token
```

---

## External APIs / Services Used

### 1) react-globe.gl (Three.js)
Used for the 3D interactive globe and orbital data visualization rendering.

### 2) CelesTrak
Used for live satellite TLE (Two-Line Element) data and orbital layers.

### 3) Open-Meteo
Used for real-time weather-based sky observability data such as cloud cover and visibility limits.

### 4) Nominatim / OpenStreetMap
Used for global location search, reverse geocoding, and place-name resolution.

### 5) Astronomy Engine
Used for calculating exact moon phases, celestial mechanics, and visible planet logic based on observer coordinates.

### 6) Custom ISS Pass Engine (via satellite.js)
Instead of relying on rate-limited external APIs like Open Notify, we built a native 24-hour orbital projection engine using `satellite.js`. It calculates live overhead ISS passes instantly on the server using CelesTrak data.

> Depending on deployment strategy and future feature expansion, additional services can be integrated, but the above are the primary services and engines used in the current Zenith observatory stack.

---

# Setup Instructions

## 1) Clone the repository

```bash
git clone <your-repository-url>
cd zenith
```

## 2) Install dependencies

```bash
npm install
```

## 3) Create a `.env.local` file

Add the required environment variable(s):

```env
NEXT_PUBLIC_CESIUM_ION_TOKEN=your_cesium_ion_token
```

## 4) Run the development server

```bash
npm run dev
```

Open the app in your browser at:

```bash
http://localhost:3000
```

---

# How the Real-Time Data Pipeline Works

Zenith’s observatory experience is built by combining **live data**, **derived calculations**, and **client-side propagation**.

## Step 1 — User selects a location

The user clicks a coordinate or searches for a place.

## Step 2 — Zenith resolves place + sky context

The backend route handlers fetch:

* location metadata from Nominatim
* weather/visibility context from Open-Meteo
* celestial context using Astronomy Engine
* ISS or orbital context where relevant

## Step 3 — Zenith builds a telemetry payload

A location-specific telemetry object is assembled, containing:

* place information
* coordinates
* timezone / local time
* cloud cover / visibility
* moon phase
* visible planets
* sky quality / observability signals
* orbital / ISS-related context

## Step 4 — Frontend renders the observatory UI

The selected location is then displayed inside the relevant observatory mode:

* location dossier / atlas
* Sky Window
* ISS / satellite mode
* Orbital Lens overlays

---

# Responsive Design Strategy

Zenith is designed to be usable across all major screen sizes.

## Desktop

* full-screen 3D globe
* observatory side panels / overlays
* rich multi-zone layouts

## Tablet

* reduced spacing
* rebalanced panels
* preserved observatory hierarchy

## Mobile

* adaptive overlays / sheets
* vertically stacked intelligence layouts
* touch-friendly controls and search flow

## Layout Techniques Used

* **Flexbox**
* **CSS Grid**
* **responsive Tailwind breakpoints**
* conditional rendering / stacked UI zones for smaller screens

---

# Performance & Data Refresh Strategy

Because Zenith combines live telemetry, a 3D globe, and orbital visualization, performance and freshness were important design considerations.

## Key performance strategies

* feature-based UI separation
* selective satellite-layer rendering
* cached / revalidated orbital datasets
* client-side orbital propagation instead of constant full server recomputation
* route-level fetching for observatory data
* refresh intervals based on data type

## Example refresh philosophy

Different observatory signals refresh at different cadences:

* **ISS position** → more frequent refresh
* **weather / cloud cover** → moderate refresh interval
* **moon / visible planets** → slower refresh cadence
* **TLE / satellite layer datasets** → cached and refreshed periodically

This keeps Zenith responsive while still feeling live.


---

# Future Scope

Potential future enhancements include:

* constellation overlays
* richer star-map rendering in Sky Window
* side-by-side location sky comparison
* orbital history playback
* aurora / meteor shower awareness
* saved observatory locations
* public observatory event mode / educational mode

---


## Suggested screenshots

* Landing page
* Launch Observatory globe
* Location Atlas / Cosmic Book
* Orbital Lens heatmap
* Satellite / ISS mode
* Sky Window
* Cosmic Time Machine

### Demo link

[Add your demo link here]

## Screenshots


---

# License

This project is intended for educational / hackathon purposes unless otherwise specified.

If you plan to open-source it publicly, you can add a standard license such as **MIT**.

---


