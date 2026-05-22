import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { SoundButton } from "@/components/sound-button";
import { PageTransition } from "@/components/page-transition";

const GAMES = ["THE SIGNAL", "THREAD", "BLACKBOX", "CHESS"];

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGameIndex((prev) => (prev + 1) % GAMES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-black">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGameIndex}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 0.04, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="text-[15vw] font-bold text-white whitespace-nowrap leading-none text-center"
          >
            {GAMES[activeGameIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      <PageTransition className="relative z-10 flex flex-col items-center gap-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-16 h-1 bg-white mb-4"
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white">
            GLO'S PARTY GAMES
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-sm md:text-base font-mono">
            Play games with friends
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-sm px-6">
          <SoundButton
            size="lg"
            className="w-full text-xl h-14 bg-white hover:bg-zinc-200 text-black font-bold tracking-widest"
            onClick={() => setLocation("/games")}
            data-testid="button-play"
          >
            PLAY
          </SoundButton>

          <SoundButton
            variant="outline"
            size="lg"
            className="w-full text-lg h-12 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-zinc-400 font-mono tracking-wider"
            onClick={() => setLocation("/settings")}
            data-testid="button-settings"
          >
            SETTINGS
          </SoundButton>
        </div>
      </PageTransition>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none opacity-30 text-xs font-mono tracking-widest text-zinc-500">
        VER 1.0.0
      </div>
    </div>
  );
}
