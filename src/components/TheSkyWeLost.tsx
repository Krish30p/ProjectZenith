"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Aperture, ChevronLeft, ChevronRight } from "lucide-react";

interface TheSkyWeLostProps {
  onEnterTimeMachine?: () => void;
}

export function TheSkyWeLost({ onEnterTimeMachine }: TheSkyWeLostProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [direction, setDirection] = useState(1);

  const flashcards = [
    {
      title: "Visible Stars",
      value: "~4,500",
      description: "In a pristine dark sky compared to roughly <strong>200</strong> in a typical metropolitan area.",
      color: "from-[#00E5FF]/10",
    },
    {
      title: "Milky Way Visibility",
      value: "0%",
      description: "For more than <strong>80%</strong> of the world's population living under severe light pollution.",
      color: "from-[#7C3AED]/10",
    },
    {
      title: "Satellite Density",
      value: ">8,000",
      description: "Active satellites in Low Earth Orbit constantly altering the celestial canvas.",
      color: "from-white/5",
    }
  ];

  const nextCard = () => {
    setDirection(1);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setDirection(-1);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Split-screen animations
  // City side (Left): Starts dim, becomes bright/polluted
  const cityBrightness = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.4, 1, 1.2]);
  const cityBlur = useTransform(scrollYProgress, [0, 0.4, 0.8], [4, 0, 0]);
  const cityScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const cityFilter = useMotionTemplate`brightness(${cityBrightness}) blur(${cityBlur}px)`;

  // Dark sky side (Right): Starts dim, becomes incredibly rich and vivid
  const starsBrightness = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.4, 1, 1.3]);
  const starsContrast = useTransform(scrollYProgress, [0, 0.4, 0.8], [0.8, 1.2, 1.6]);
  const starsScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const starsFilter = useMotionTemplate`brightness(${starsBrightness}) contrast(${starsContrast})`;

  // Text overlay fade out
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  // Mobile layout adjustment: we stack the images vertically on small screens
  // but we can just let object-cover handle the sides. Let's keep it side-by-side but with a gradient divider.

  return (
    <section className="relative bg-[#020617]" id="the-sky-we-lost">
      {/* Scrollable Container for Split Screen */}
      <div ref={containerRef} className="h-[400vh] relative">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col md:flex-row">
          
          {/* Overlay Text (Centered) */}
          <motion.div 
            style={{ opacity: textOpacity, y: textY }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none text-center px-4 bg-black/30 md:bg-transparent"
          >
            <h2 className="font-primary font-bold text-5xl md:text-7xl lg:text-9xl text-white tracking-tight mb-6 drop-shadow-[0_0_40px_rgba(0,0,0,0.8)]">
              SEE WHAT THE CITY HIDES
            </h2>
            <p className="font-primary text-xl md:text-3xl text-slate-200 max-w-3xl drop-shadow-[0_0_20px_rgba(0,0,0,0.9)] font-medium">
              The universe has not disappeared. <br/>
              Our ability to see it has.
            </p>
          </motion.div>

          {/* Left Side: City */}
          <div className="w-full h-1/2 md:w-1/2 md:h-full relative overflow-hidden bg-black border-b md:border-b-0 md:border-r border-white/10">
            <motion.div
              style={{ 
                scale: cityScale, 
                filter: cityFilter 
              }}
              className="absolute inset-0"
            >
              <Image 
                src="/city-light.png" 
                alt="City Light Pollution" 
                fill
                className="object-cover object-center"
                priority
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 left-6 md:bottom-12 md:left-12 z-20">
              <p className="font-primary text-xs md:text-sm tracking-[0.2em] text-[#00E5FF] uppercase font-bold mb-1">Bortle Class 9</p>
              <p className="font-primary text-xl md:text-3xl text-white font-medium">Inner-city Sky</p>
            </div>
          </div>

          {/* Right Side: Dark Sky */}
          <div className="w-full h-1/2 md:w-1/2 md:h-full relative overflow-hidden bg-black">
            <motion.div
              style={{ 
                scale: starsScale, 
                filter: starsFilter 
              }}
              className="absolute inset-0"
            >
              <Image 
                src="/dark-sky.png" 
                alt="Pristine Dark Sky" 
                fill
                className="object-cover object-center"
                priority
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-l from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-20 text-right">
              <p className="font-primary text-xs md:text-sm tracking-[0.2em] text-[#7C3AED] uppercase font-bold mb-1">Bortle Class 1</p>
              <p className="font-primary text-xl md:text-3xl text-white font-medium">Pristine Dark-Sky</p>
            </div>
          </div>

        </div>
      </div>

      {/* Interactive Data Flashcards Section & Cosmic Time Machine Entry */}
      <div className="relative z-40 bg-[#020617] py-32 px-4 sm:px-6 lg:px-8 shadow-[0_-50px_100px_rgba(2,6,23,1)] overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 relative min-h-[500px] items-center">
          
          {/* Left Column: Flashcards */}
          <div className="relative w-full min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentCard}
                initial={{ opacity: 0, x: direction * 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -50 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute w-full px-12 md:px-0"
              >
                <div className="p-10 md:p-14 rounded-[2rem] bg-white/[0.03] border border-white/10 backdrop-blur-2xl relative overflow-hidden group shadow-2xl">
                  <div className={`absolute inset-0 bg-gradient-to-br ${flashcards[currentCard].color} to-transparent opacity-50`} />
                  <div className="relative z-10 text-center">
                    <h3 className="font-primary text-slate-400 text-sm tracking-[0.2em] uppercase mb-8 font-semibold">
                      {flashcards[currentCard].title}
                    </h3>
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <span className="font-primary text-7xl md:text-9xl font-bold text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        {flashcards[currentCard].value}
                      </span>
                    </div>
                    <div className="h-[1px] w-24 bg-white/20 mx-auto mb-8" />
                    <p 
                      className="text-slate-300 font-primary text-xl md:text-2xl leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: flashcards[currentCard].description }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 md:-left-8 z-50">
              <button 
                onClick={prevCard}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-md"
                aria-label="Previous card"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 md:-right-8 z-50">
              <button 
                onClick={nextCard}
                className="p-4 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:scale-110 transition-all backdrop-blur-md"
                aria-label="Next card"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </div>
            
            {/* Pagination Indicators */}
            <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 flex gap-3 z-50">
              {flashcards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentCard ? 1 : -1);
                    setCurrentCard(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentCard ? "w-8 bg-white" : "w-2 bg-white/20 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Cosmic Time Machine */}
          <div className="relative w-full flex flex-col items-center lg:items-start text-center lg:text-left px-8 py-12 lg:py-0 border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-16">
            {/* Ambient portal glow for the button area */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)] animate-pulse pointer-events-none" />
            
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-bold tracking-widest uppercase">
              <Aperture className="w-4 h-4 animate-[spin-slow_4s_linear_infinite]" />
              Temporal Observatory
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
              Cosmic Time Machine
            </h2>

            <div className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed space-y-4">
              <p>Do you want to see the sky before we changed it?</p>
              <p>Step inside and watch the sky change.</p>
            </div>

            <button
              onClick={onEnterTimeMachine}
              className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full border border-white/20 transition-all hover:border-[#00E5FF] hover:shadow-[0_0_30px_rgba(0,229,255,0.3)] w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-[#00E5FF]/10 transition-colors" />
              <span className="relative z-10 text-white font-medium tracking-wide group-hover:text-[#00E5FF] transition-colors flex items-center justify-center gap-3">
                Enter the Machine
                <Aperture className="w-4 h-4 group-hover:animate-spin" />
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Immersive Typographic Moment */}
      <div className="relative min-h-[80vh] flex items-center justify-center bg-[#020617] px-6 py-32 overflow-hidden">
        {/* Soft atmospheric glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[600px] bg-gradient-to-tr from-[#00E5FF]/5 to-[#7C3AED]/5 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-20%" }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          <h2 className="font-primary font-bold text-4xl md:text-6xl lg:text-8xl text-white leading-[1.1] tracking-tight">
            More than half the world can no longer see the Milky Way clearly.
          </h2>
        </motion.div>
      </div>

      {/* Transition to Solution */}
      <div className="relative min-h-[60vh] flex flex-col items-center justify-center bg-[#020617] px-6 py-32 pb-48">
        <div className="text-center max-w-4xl mx-auto">
          <motion.p 
            initial={{ opacity: 0, filter: "blur(20px)", y: 30 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: false, margin: "-10%" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-primary text-2xl md:text-4xl lg:text-5xl text-slate-400 mb-6 font-medium"
          >
            Every location on Earth has a different sky.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, filter: "blur(20px)", scale: 0.9 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            viewport={{ once: false, margin: "-10%" }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-primary text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
          >
            Zenith helps you understand yours.
          </motion.p>
          
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: 120, opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
            className="mt-24 w-[1px] bg-gradient-to-b from-[#00E5FF]/50 via-[#7C3AED]/50 to-transparent mx-auto"
          />
        </div>
      </div>

    </section>
  );
}
