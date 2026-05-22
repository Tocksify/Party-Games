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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ghost Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeGameIndex}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 0.05, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="text-[15vw] font-bold text-primary whitespace-nowrap leading-none text-center"
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
            className="w-16 h-1 bg-primary mb-4"
          />
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground drop-shadow-[0_0_15px_rgba(255,0,255,0.3)]">
            GLO'S PARTY GAMES
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm md:text-base font-mono">
            Initiate connection sequence
          </p>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-sm px-6">
          <SoundButton
            size="lg"
            className="w-full text-xl h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-widest relative overflow-hidden group border border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
            onClick={() => setLocation("/games")}
            data-testid="button-play"
          >
            <span className="relative z-10">PLAY</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </SoundButton>
          
          <SoundButton
            variant="outline"
            size="lg"
            className="w-full text-lg h-14 border-white/10 hover:border-primary/50 hover:bg-white/5 font-mono tracking-wider"
            onClick={() => setLocation("/settings")}
            data-testid="button-settings"
          >
            SETTINGS
          </SoundButton>
        </div>
      </PageTransition>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none opacity-50 text-xs font-mono tracking-widest">
        SYSTEM ONLINE • VER 1.0.0
      </div>
    </div>
  );
}
