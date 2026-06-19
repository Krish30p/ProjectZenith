import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "ZENITH — The Celestial Eye",
  description: "From the scale of the universe to the sky above you. Discover satellites, planets, constellations, and celestial events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "dark", "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-[#020617] text-[#F8FAFC] font-sans">
        {children}
      </body>
    </html>
  );
}
