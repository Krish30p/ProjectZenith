export type CosmicTimeMachineYear = {
  year: number;
  isProjected: boolean;

  // semantic label
  eraLabel: string;
  shortTitle: string;

  // core quantitative story
  activeSatellites: number;
  congestionScore: number;        // 0 - 100
  skyImpactScore: number;         // 0 - 100
  visualIntensity: number;        // 0 - 100, drives scene intensity

  // narrative content
  headline: string;
  subheadline: string;
  insightText: string;

  // metadata for UI honesty
  dataMode: 'historical' | 'present-day' | 'projected';
  disclosureLabel: string;

  // optional helper fields for richer UI
  milestoneTags?: string[];
  atmosphereTone?: 'quiet' | 'emerging' | 'accelerating' | 'crowded' | 'critical';
};

export const COSMIC_TIME_MACHINE_YEARS: CosmicTimeMachineYear[] = [
  {
    year: 2010,
    isProjected: false,
    eraLabel: "Historical Snapshot",
    shortTitle: "A Quieter Sky",
    activeSatellites: 958,
    congestionScore: 12,
    skyImpactScore: 8,
    visualIntensity: 10,
    headline: "The Calm Before the Storm",
    subheadline: "A sparser orbital environment where human architecture remained largely invisible from the ground.",
    insightText: "Humanity had placed critical infrastructure in orbit, but the night sky belonged predominantly to the stars. The physical barrier between Earth and space was mostly uncluttered, with orbital mechanics functioning at a fraction of today's density.",
    dataMode: "historical",
    disclosureLabel: "Historical orbital snapshot",
    milestoneTags: ["Low Traffic", "Sparse LEO", "Scientific Dominance"],
    atmosphereTone: "quiet"
  },
  {
    year: 2015,
    isProjected: false,
    eraLabel: "Early Orbital Expansion",
    shortTitle: "The Expansion Begins",
    activeSatellites: 1381,
    congestionScore: 18,
    skyImpactScore: 15,
    visualIntensity: 25,
    headline: "Building the Foundation",
    subheadline: "Global communication and observation networks began scaling upward.",
    insightText: "As launch costs gradually fell, national space agencies were joined by a growing commercial sector. The foundation for localized constellations was laid, quietly paving the way for a paradigm shift in how we utilize low Earth orbit.",
    dataMode: "historical",
    disclosureLabel: "Historical orbital snapshot",
    milestoneTags: ["Commercial Growth", "Infrastructure Scale-Up"],
    atmosphereTone: "emerging"
  },
  {
    year: 2020,
    isProjected: false,
    eraLabel: "Acceleration Era",
    shortTitle: "Constellations Accelerate",
    activeSatellites: 3371,
    congestionScore: 35,
    skyImpactScore: 32,
    visualIntensity: 45,
    headline: "The Mega-Constellation Shift",
    subheadline: "The turning point where low-latency global networks began blanketing the planet.",
    insightText: "A dramatic acceleration in orbital traffic occurred as the first true mega-constellations deployed in mass. Hundreds of commercial assets were injected into low Earth orbit at an unprecedented pace, permanently altering the orbital carrying capacity.",
    dataMode: "historical",
    disclosureLabel: "Historical orbital snapshot",
    milestoneTags: ["Mega-Constellations", "Rapid Deployment", "LEO Saturation Begins"],
    atmosphereTone: "accelerating"
  },
  {
    year: 2025,
    isProjected: false,
    eraLabel: "Present-Day Orbital State",
    shortTitle: "The Crowded Present",
    activeSatellites: 10500,
    congestionScore: 78,
    skyImpactScore: 82,
    visualIntensity: 80,
    headline: "The Sky We Lost",
    subheadline: "The modern environment is a densely congested lattice of artificial objects.",
    insightText: "The sky is no longer shaped solely by stars and planets. Over ten thousand active artificial objects now trace the heavens. The celestial background is routinely interrupted by brilliant satellite trains and the sheer volume of orbital infrastructure.",
    dataMode: "present-day",
    disclosureLabel: "Present-day orbital environment",
    milestoneTags: ["Extreme Density", "Astronomical Interference", "Collision Avoidance Spikes"],
    atmosphereTone: "crowded"
  },
  {
    year: 2030,
    isProjected: true,
    eraLabel: "Projected Orbital Load",
    shortTitle: "Projected Orbital Pressure",
    activeSatellites: 24000,
    congestionScore: 92,
    skyImpactScore: 90,
    visualIntensity: 95,
    headline: "A Heavily Congested Horizon",
    subheadline: "Forecasted traffic models suggest an environment nearing systemic capacity limits.",
    insightText: "Based on regulatory filings and launch cadences, the near future reveals an exponentially heavier burden on orbit. The physical risk of conjunctions becomes a daily operational hazard, and the visual footprint of humanity entirely dominates low Earth orbit.",
    dataMode: "projected",
    disclosureLabel: "Forecast congestion scenario — not a live measurement",
    milestoneTags: ["Projected Saturation", "Systemic Strain", "Elevated Conjunction Risk"],
    atmosphereTone: "critical"
  },
  {
    year: 2035,
    isProjected: true,
    eraLabel: "Forecast Congestion Scenario",
    shortTitle: "A Contested Celestial Future",
    activeSatellites: 58000,
    congestionScore: 100,
    skyImpactScore: 100,
    visualIntensity: 100,
    headline: "The Brink of Kessler",
    subheadline: "An extreme projection of unrestricted orbital growth and celestial erasure.",
    insightText: "If deployment continues unchecked, the orbital frontier transforms into a suffocating, hyper-congested shell. The astronomical community struggles to see through the artificial veil, warning of catastrophic cascading debris risks if the architecture collapses.",
    dataMode: "projected",
    disclosureLabel: "Extreme forecast model — projected scenario only",
    milestoneTags: ["Kessler Warning", "Celestial Erasure", "Hyper-Congested Shell"],
    atmosphereTone: "critical"
  }
];
