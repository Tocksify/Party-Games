import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetRoom, useCloseRoom, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Users, ShieldAlert, Play } from "lucide-react";

function getErrMsg(err: unknown): string {
  return (err as any)?.data?.error ?? "Something went wrong";
}

export default function RoomView() {
  const { game, code } = useParams<{ game: string; code: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const { data: room, isLoading } = useGetRoom(code || "", {
    query: {
      queryKey: getGetRoomQueryKey(code || ""),
      enabled: !!code,
      refetchInterval: 3000,
    }
  });

  const closeRoom = useCloseRoom();
  const isHost = user && room && user.username === room.hostUsername;

  const codeRef = useRef(code);
  const alreadyClosedRef = useRef(false);

  useEffect(() => { codeRef.current = code; }, [code]);

  const doCloseRoom = () => {
    const currentCode = codeRef.current;
    if (!currentCode || alreadyClosedRef.current) return;
    alreadyClosedRef.current = true;
    const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
    fetch(`${apiBase}/api/rooms/${currentCode}`, {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    const handleBeforeUnload = () => doCloseRoom();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      doCloseRoom();
    };
  }, []);

  const handleStartGame = async () => {
    if (!code) return;
    setIsStarting(true);
    const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
    try {
      const res = await fetch(`${apiBase}/api/rooms/${code}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Error", description: data.error ?? "Failed to start game" });
      } else {
        queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Could not reach server" });
    } finally {
      setIsStarting(false);
    }
  };

  const handleClose = () => {
    if (!code) return;
    alreadyClosedRef.current = true;
    closeRoom.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          setLocation(`/rooms/${game}`);
        },
        onError: (err) => {
          alreadyClosedRef.current = false;
          toast({ variant: "destructive", title: "Error", description: getErrMsg(err) });
        }
      }
    );
  };

  const handleLeave = () => {
    setLocation(`/rooms/${game}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-zinc-600 text-sm animate-pulse">
        Connecting...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-red-500 gap-4">
        <div className="text-sm">Room not found or closed.</div>
        <SoundButton onClick={() => setLocation(`/rooms/${game}`)} className="bg-white text-black">Back to Lobby</SoundButton>
      </div>
    );
  }

  const isActive = room.status === "active";

  return (
    <PageTransition className="min-h-screen bg-black p-6 md:p-12 max-w-6xl mx-auto flex flex-col relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <SoundButton variant="ghost" size="icon" onClick={handleLeave} className="text-zinc-400 hover:bg-zinc-900" data-testid="button-back">
            <ChevronLeft className="w-5 h-5" />
          </SoundButton>
          <div>
            <h1 className="text-2xl font-bold font-mono tracking-widest text-white">{room.name}</h1>
            <div className="text-xs font-mono text-zinc-600 mt-0.5">
              {room.game.toUpperCase()} • Code: <span className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">{room.code}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SoundButton variant="outline" onClick={handleLeave} className="border-zinc-800 text-zinc-400 hover:border-zinc-600" data-testid="button-leave">
            Leave
          </SoundButton>
          {isHost && !isActive && (
            <SoundButton
              onClick={handleStartGame}
              disabled={isStarting || room.playerCount < 2}
              className="bg-white hover:bg-zinc-200 text-black font-bold"
              data-testid="button-start-game"
              title={room.playerCount < 2 ? "Need at least 2 players to start" : undefined}
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? "Starting..." : "Start Game"}
            </SoundButton>
          )}
          {isHost && (
            <SoundButton
              variant="destructive"
              onClick={handleClose}
              disabled={closeRoom.isPending}
              data-testid="button-close-room"
            >
              <ShieldAlert className="w-4 h-4 mr-2" /> Close Room
            </SoundButton>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-8 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center min-h-[360px]">
          {isActive ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-white border border-white/20 mb-2">
                <Play className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-widest text-white">Game In Progress</h2>
              <div className="text-zinc-500 font-mono text-sm">
                The game has started. Good luck!
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 mb-2">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold tracking-widest text-white">Waiting for players</h2>
              <div className="text-zinc-600 font-mono text-sm">
                {isHost
                  ? room.playerCount < 2
                    ? "Need at least 2 players before you can start."
                    : "Everyone ready? Hit Start Game above."
                  : "Waiting for the host to start the game."}
              </div>
              <div className="mt-6 font-mono text-sm bg-black px-5 py-3 rounded border border-zinc-800 inline-block text-zinc-400">
                {room.playerCount} / {room.maxPlayers} players
              </div>
            </div>
          )}
        </div>

        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl h-fit">
          <h3 className="font-mono text-xs tracking-widest text-zinc-600 mb-4 uppercase">Room Info</h3>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">Host</span>
              <span className="text-white">{room.hostUsername}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Status</span>
              <span className={isActive ? "text-white" : "text-zinc-400"}>{room.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Players</span>
              <span className="text-zinc-400">{room.playerCount} / {room.maxPlayers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">Created</span>
              <span className="text-zinc-400">{new Date(room.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
