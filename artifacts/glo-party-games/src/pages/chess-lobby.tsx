import { useLocation } from "wouter";
import { useListChessGames, useOpenChessGame, useRequestChessGame, useRespondChessRequest, getListChessGamesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Swords, HelpCircle, X } from "lucide-react";
import { useState } from "react";

function getErrMsg(err: unknown): string {
  return (err as any)?.data?.error ?? "Something went wrong";
}

const CHESS_STEPS = [
  "White pieces always move first. Players alternate turns.",
  "Move pieces to control the board and threaten your opponent's king.",
  "Pawns move forward one square (or two from their starting row) and capture diagonally.",
  "Rooks move any number of squares horizontally or vertically.",
  "Knights move in an L-shape: two squares in one direction, then one square perpendicular.",
  "Bishops move any number of squares diagonally.",
  "The Queen is the most powerful piece — she moves any number of squares in any direction.",
  "The King moves one square in any direction. Keep your king safe!",
  "Put your opponent's king in a position it can't escape — that's checkmate. You win!",
];

function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white tracking-wide">How to Play — Chess</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ol className="space-y-3">
          {CHESS_STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-300">
              <span className="text-zinc-600 font-mono shrink-0">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function ChessLobby() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHowTo, setShowHowTo] = useState(false);

  const { data: games = [], isLoading } = useListChessGames({
    query: {
      queryKey: getListChessGamesQueryKey(),
      refetchInterval: 5000,
    }
  });

  const openGame = useOpenChessGame();
  const requestGame = useRequestChessGame();
  const respondRequest = useRespondChessRequest();

  const handleOpenGame = () => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    openGame.mutate(undefined, {
      onSuccess: (game) => {
        queryClient.invalidateQueries({ queryKey: getListChessGamesQueryKey() });
        setLocation(`/chess/${game.id}`);
      },
      onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
    });
  };

  const handleRequest = (gameId: number) => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    requestGame.mutate(
      { id: gameId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChessGamesQueryKey() });
          toast({ title: "Request sent", description: "Waiting for the host to accept..." });
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
      }
    );
  };

  return (
    <PageTransition className="min-h-screen bg-black p-6 md:p-12 max-w-5xl mx-auto flex flex-col relative z-10">
      {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/games")} className="text-zinc-400 hover:bg-zinc-900" data-testid="button-back">
            <ChevronLeft className="w-5 h-5" />
          </SoundButton>
          <h1 className="text-2xl font-bold font-mono tracking-widest text-white">CHESS</h1>
          <button
            onClick={() => setShowHowTo(true)}
            className="text-zinc-600 hover:text-zinc-300 transition-colors ml-1"
            title="How to Play"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
        <SoundButton
          onClick={handleOpenGame}
          disabled={openGame.isPending}
          className="bg-white hover:bg-zinc-200 text-black font-bold"
          data-testid="button-open-game"
        >
          <PlusIcon className="w-4 h-4 mr-2" /> Open a Game
        </SoundButton>
      </header>

      <div className="flex-1">
        <h2 className="text-sm font-mono tracking-widest text-zinc-600 mb-4 uppercase">Open Challenges</h2>
        {isLoading ? (
          <div className="text-zinc-600 font-mono text-sm animate-pulse">Loading...</div>
        ) : games.length === 0 ? (
          <div className="text-zinc-600 font-mono text-sm">No open games. Be the first to open one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {games.map(game => {
              const isHost = user?.username === game.hostUsername;
              const hasChallenger = !!game.challengerUsername;

              return (
                <div key={game.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-zinc-600 font-mono mb-1">HOST</div>
                    <div className="font-bold text-white">{game.hostUsername}</div>
                    <div className="text-xs font-mono mt-1 text-zinc-600">{game.status.toUpperCase()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isHost && hasChallenger ? (
                      <div className="flex flex-col gap-2 items-end">
                        <div className="text-xs font-mono text-zinc-400">{game.challengerUsername} wants to play</div>
                        <div className="flex gap-2">
                          <SoundButton
                            size="sm"
                            className="bg-white text-black font-bold hover:bg-zinc-200"
                            onClick={() => respondRequest.mutate(
                              { id: game.id, data: { accept: true, challengerUsername: game.challengerUsername! } },
                              { onSuccess: () => setLocation(`/chess/${game.id}`) }
                            )}
                          >
                            Accept
                          </SoundButton>
                          <SoundButton
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 text-zinc-400"
                            onClick={() => respondRequest.mutate(
                              { id: game.id, data: { accept: false, challengerUsername: game.challengerUsername! } },
                              { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChessGamesQueryKey() }) }
                            )}
                          >
                            Decline
                          </SoundButton>
                        </div>
                      </div>
                    ) : isHost ? (
                      <SoundButton
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 text-zinc-500"
                        onClick={() => setLocation(`/chess/${game.id}`)}
                      >
                        Waiting...
                      </SoundButton>
                    ) : (
                      <SoundButton
                        size="sm"
                        onClick={() => handleRequest(game.id)}
                        disabled={requestGame.isPending || game.status !== "open"}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                        data-testid={`button-request-${game.id}`}
                      >
                        <Swords className="w-3.5 h-3.5 mr-1.5" /> Challenge
                      </SoundButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}
