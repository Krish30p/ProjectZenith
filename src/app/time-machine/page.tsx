import { CosmicTimeMachine } from "@/components/time-machine/CosmicTimeMachine";
import { Navbar } from "@/components/Navbar";

export default function TimeMachinePage() {
  return (
    <main className="w-full min-h-screen bg-[#01030A]">
      <Navbar />
      <CosmicTimeMachine />
    </main>
  );
}
