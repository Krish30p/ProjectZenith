"use client";

import { Navbar } from "@/components/Navbar";
import { FeaturesArchive } from "@/components/FeaturesArchive";

export default function FeaturesPage() {
  return (
    <main className="relative min-h-screen bg-[#020617]">
      <Navbar />
      <FeaturesArchive />
    </main>
  );
}
