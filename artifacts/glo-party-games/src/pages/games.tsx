import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { audio } from "@/lib/audio";
import { ChevronLeft } from "lucide-react";

const GAMES = [
  { id: "the-signal", name: "The Signal", path: "/rooms/the-signal", color: "hsl(317, 100%, 54%)" },
  { id: "thread", name: "Thread", path: "/rooms/thread", color: "hsl(198, 100%, 50%)" },
  { id: "blackbox", name: "Blackbox", path: "/rooms/blackbox", color: "hsl(135, 100%, 50%)" },
  { id: "chess", name: "Chess", path: "/chess", color: "hsl(45, 100%, 50%)" },
];

export default function Games() {
  const [, setLocation] = useLocation();
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const activeGame = GAMES.find((g) => g.id === hoveredGame);

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col p-6 md:p-12">
      {/* Background Ghost Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <AnimatePresence mode="wait">
          {activeGame ? (
            <motion.div
              key={activeGame.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 0.08, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="text-[12vw] font-bold whitespace-nowrap leading-none text-center"
              style={{ color: activeGame.color }}
            >
              {activeGame.name.toUpperCase()}
            </motion.div>
          ) : (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.03 }}
              exit={{ opacity: 0 }}
              className="text-[10vw] font-bold text-white whitespace-nowrap leading-none text-center"
            >
              SELECT
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PageTransition className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-12">
          <SoundButton
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
            className="hover:bg-white/10"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </SoundButton>
          <div className="text-sm font-mono tracking-widest text-muted-foreground uppercase">
            Select Protocol
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 place-content-center">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <button
                className="w-full text-left p-8 md:p-12 rounded-xl bg-card/40 border border-white/5 hover:border-white/20 transition-all duration-300 relative overflow-hidden group cursor-pointer backdrop-blur-sm"
                onMouseEnter={() => {
                  audio.playHover();
                  setHoveredGame(game.id);
                }}
                onMouseLeave={() => setHoveredGame(null)}
                onClick={() => {
                  audio.playSelect();
                  setLocation(game.path);
                }}
                data-testid={`card-game-${game.id}`}
              >
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${game.color} 0%, transparent 70%)` }}
                />
                
                <div className="relative z-10 flex flex-col gap-2">
                  <span className="text-xs font-mono tracking-widest text-muted-foreground">
                    0{i + 1}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight group-hover:translate-x-2 transition-transform duration-300">
                    {game.name}
                  </h2>
                </div>
                
                <div 
                  className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ease-out"
                  style={{ backgroundColor: game.color }}
                />
              </button>
            </motion.div>
          ))}
        </div>
      </PageTransition>
    </div>
  );
}
