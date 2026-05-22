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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col p-6 md:p-12 bg-black">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0">
        <AnimatePresence mode="wait">
          {activeGame ? (
            <motion.div
              key={activeGame.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 0.06, scale: 1 }}
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
            className="hover:bg-zinc-900 text-zinc-400"
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </SoundButton>
          <div className="text-sm font-mono tracking-widest text-zinc-500 uppercase">
            Select a game
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 place-content-center">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <button
                className="w-full text-left p-8 md:p-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-200 relative overflow-hidden group cursor-pointer"
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
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at center, ${game.color} 0%, transparent 70%)` }}
                />

                <div className="relative z-10 flex flex-col gap-2">
                  <span className="text-xs font-mono tracking-widest text-zinc-600">
                    0{i + 1}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white group-hover:translate-x-1 transition-transform duration-200">
                    {game.name}
                  </h2>
                </div>

                <div
                  className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-400 ease-out"
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
