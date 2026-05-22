import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useListRooms, useCreateRoom, useJoinRoom, getListRoomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Plus, LogIn, Users, HelpCircle, X } from "lucide-react";

type GameSlug = "the-signal" | "thread" | "blackbox";

const HOW_TO_PLAY: Record<GameSlug, { title: string; steps: string[] }> = {
  "the-signal": {
    title: "The Signal",
    steps: [
      "One player is secretly chosen as the Interceptor.",
      "The other players receive a secret word and must give one-word clues to help each other guess it.",
      "The Interceptor listens to the clues and tries to figure out the secret word before the team does.",
      "If the Interceptor guesses the word, they win. If the team guesses it first, the team wins.",
      "Stay vague enough to confuse the Interceptor, but clear enough for your team!",
    ],
  },
  "thread": {
    title: "Thread",
    steps: [
      "Players take turns saying a word that connects to the previous word.",
      "Each word must have a clear, logical link to the word before it.",
      "You cannot repeat words that have already been said.",
      "If you can't think of a word in time, or your link is rejected by the group, you're out.",
      "Last player remaining wins the round!",
    ],
  },
  "blackbox": {
    title: "Blackbox",
    steps: [
      "One player secretly places atoms inside a grid (the blackbox).",
      "Other players fire probes into the grid from the edges.",
      "Probes deflect, reflect, or pass through depending on where atoms are hidden.",
      "Use the probe results to deduce the locations of all hidden atoms.",
      "The player who finds all atoms using the fewest probes wins!",
    ],
  },
};

function getErrMsg(err: unknown): string {
  return (err as any)?.data?.error ?? "Something went wrong";
}

function HowToPlayModal({ game, onClose }: { game: GameSlug; onClose: () => void }) {
  const info = HOW_TO_PLAY[game];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white tracking-wide">How to Play — {info.title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ol className="space-y-3">
          {info.steps.map((step, i) => (
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

export default function RoomLobby() {
  const { game } = useParams<{ game: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validGame = game as GameSlug;
  const listParams = { game: validGame, status: "waiting" as const };

  const { data: rooms = [], isLoading } = useListRooms(
    listParams,
    { query: { queryKey: getListRoomsQueryKey(listParams), enabled: !!validGame, refetchInterval: 5000 } }
  );

  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [showJoin, setShowJoin] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
    const token = localStorage.getItem("auth_token");
    fetch(`${apiBase}/api/rooms/mine?game=${validGame}`, {
      method: "DELETE",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  }, [isAuthenticated, user?.id, validGame]);

  const handleCreate = () => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    createRoom.mutate(
      { data: { game: validGame, name: user!.username, maxPlayers: parseInt(maxPlayers, 10) } as any },
      {
        onSuccess: (room) => {
          queryClient.invalidateQueries({ queryKey: getListRoomsQueryKey(listParams) });
          setLocation(`/rooms/${validGame}/${room.code}`);
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
      }
    );
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    let code = joinCode.trim().toUpperCase();
    if (code.includes(":")) {
      const parts = code.split(":");
      code = parts[parts.length - 1];
    }

    joinRoom.mutate(
      { code, data: {} },
      {
        onSuccess: () => setLocation(`/rooms/${validGame}/${code}`),
        onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
      }
    );
  };

  const gameTitle = game?.replace(/-/g, " ").toUpperCase() || "LOBBY";

  return (
    <PageTransition className="min-h-screen bg-black p-6 md:p-12 max-w-5xl mx-auto flex flex-col relative z-10">
      {showHowTo && validGame in HOW_TO_PLAY && (
        <HowToPlayModal game={validGame} onClose={() => setShowHowTo(false)} />
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/games")} className="text-zinc-400 hover:bg-zinc-900" data-testid="button-back">
            <ChevronLeft className="w-5 h-5" />
          </SoundButton>
          <h1 className="text-2xl font-bold font-mono tracking-widest text-white">{gameTitle}</h1>
          {validGame in HOW_TO_PLAY && (
            <button
              onClick={() => setShowHowTo(true)}
              className="text-zinc-600 hover:text-zinc-300 transition-colors ml-1"
              title="How to Play"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SoundButton
            variant="outline"
            onClick={() => setShowJoin(!showJoin)}
            className="border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white"
            data-testid="button-show-join"
          >
            <LogIn className="w-4 h-4 mr-2" /> Join by Code
          </SoundButton>
          <div className="flex items-center gap-2">
            <select
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="h-9 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm px-2 focus:outline-none focus:border-zinc-600"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n} players</option>
              ))}
            </select>
            <SoundButton
              onClick={handleCreate}
              disabled={createRoom.isPending}
              className="bg-white hover:bg-zinc-200 text-black font-bold"
              data-testid="button-show-host"
            >
              <Plus className="w-4 h-4 mr-2" /> Host Room
            </SoundButton>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-6">
        {showJoin && (
          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl">
            <form onSubmit={handleJoinByCode} className="flex gap-3">
              <Input
                placeholder="Enter room code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-600"
                data-testid="input-join-code"
              />
              <SoundButton type="submit" disabled={joinRoom.isPending} className="bg-white text-black font-bold" data-testid="button-join-submit">
                {joinRoom.isPending ? "Joining..." : "Join"}
              </SoundButton>
            </form>
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-sm font-mono tracking-widest text-zinc-600 mb-4 uppercase">Open Rooms</h2>
          {isLoading ? (
            <div className="text-zinc-600 font-mono text-sm animate-pulse">Loading...</div>
          ) : rooms.length === 0 ? (
            <div className="text-zinc-600 font-mono text-sm">No open rooms. Host one to get started.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map(room => (
                <div key={room.id} className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-white truncate pr-4">{room.name}</h3>
                    <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 shrink-0">{room.code}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center text-sm text-zinc-500 font-mono">
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      {room.playerCount} / {room.maxPlayers}
                    </div>
                    <SoundButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        joinRoom.mutate(
                          { code: room.code, data: {} },
                          {
                            onSuccess: () => setLocation(`/rooms/${validGame}/${room.code}`),
                            onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
                          }
                        );
                      }}
                      disabled={joinRoom.isPending}
                      className="border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
                      data-testid={`button-join-${room.code}`}
                    >
                      Join
                    </SoundButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
