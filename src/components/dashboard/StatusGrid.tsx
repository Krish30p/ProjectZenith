"use client";

import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TelemetryData, IssData } from './DashboardClient';

interface Props {
  telemetry: TelemetryData | null;
  issData: IssData | null;
}

const LiveIndicator = () => (
  <div className="flex items-center gap-1.5">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </span>
    <span className="text-[10px] font-mono text-red-500 tracking-widest font-bold">LIVE</span>
  </div>
);

interface CardProps {
  title: string;
  value: string | number | React.ReactNode;
  unit?: string;
  updatedAt: number; // real epoch ms from server
  delay: number;
  refreshLabel: string; // e.g. "30s" or "10min"
}

const Card = ({ title, value, unit, updatedAt, delay, refreshLabel }: CardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 relative overflow-hidden hover:bg-white/10 transition-colors"
  >
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-xs font-mono text-slate-400 tracking-widest uppercase">{title}</h3>
      <LiveIndicator />
    </div>

    <div className="flex items-baseline gap-1 mt-3">
      <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
      {unit && <span className="text-sm font-mono text-slate-400">{unit}</span>}
    </div>

    <div className="mt-4 flex justify-between items-end border-t border-white/10 pt-2">
      <span className="text-[10px] font-mono text-slate-500">LST UPD</span>
      <div className="text-right">
        <span className="text-[10px] font-mono text-slate-400 block">
          {format(new Date(updatedAt), 'HH:mm:ss')}
        </span>
        <span className="text-[9px] font-mono text-slate-600">↻ {refreshLabel}</span>
      </div>
    </div>
  </motion.div>
);

function getMoonPhaseName(phaseDegree: number) {
  const norm = phaseDegree % 360;
  if (norm < 10 || norm > 350) return 'New Moon';
  if (norm < 80) return 'Waxing Crescent';
  if (norm < 100) return 'First Quarter';
  if (norm < 170) return 'Waxing Gibbous';
  if (norm < 190) return 'Full Moon';
  if (norm < 260) return 'Waning Gibbous';
  if (norm < 280) return 'Last Quarter';
  return 'Waning Crescent';
}

export default function StatusGrid({ telemetry, issData }: Props) {
  if (!telemetry) return null;

  const phaseName = getMoonPhaseName(telemetry.moonPhase);
  const fallbackTime = telemetry.timestamps.celestial;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card
        title="Cloud Cover"
        value={telemetry.cloudCover}
        unit="%"
        updatedAt={telemetry.timestamps.weather}
        refreshLabel="10 min"
        delay={0}
      />
      <Card
        title="Sky Score"
        value={telemetry.skyQualityScore}
        unit="/ 100"
        updatedAt={telemetry.timestamps.weather}
        refreshLabel="10 min"
        delay={1}
      />
      <Card
        title="Moon Phase"
        value={phaseName}
        updatedAt={telemetry.timestamps.celestial}
        refreshLabel="1 hr"
        delay={2}
      />
      <Card
        title="Visible Planets"
        value={telemetry.visiblePlanets.length}
        unit="BODIES"
        updatedAt={telemetry.timestamps.celestial}
        refreshLabel="1 hr"
        delay={3}
      />
      <Card
        title="Active Satellites"
        value={telemetry.satellitesOverhead}
        unit="TRACKED"
        updatedAt={telemetry.timestamps.satellites}
        refreshLabel="5 min"
        delay={4}
      />
      <Card
        title="ISS Position"
        value={
          issData
            ? `${issData.latitude.toFixed(2)}°, ${issData.longitude.toFixed(2)}°`
            : 'LOS'
        }
        updatedAt={issData?.updatedAt ?? fallbackTime}
        refreshLabel="30 sec"
        delay={5}
      />
    </div>
  );
}
