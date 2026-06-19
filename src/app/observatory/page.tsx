import ObservatoryClient from "@/components/observatory/ObservatoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zenith Observatory — Explore Earth's Sky",
  description:
    "Fullscreen interactive 3D globe. Click any location on Earth to receive real-time celestial intelligence: moon phase, visible planets, ISS tracking, satellite density, and more.",
};

export default function ObservatoryPage() {
  return <ObservatoryClient />;
}
