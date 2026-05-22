import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useListRooms, useCreateRoom, useJoinRoom, getListRoomsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Plus, LogIn, Users } from "lucide-react";

type GameSlug = "the-signal" | "thread" | "blackbox";

function getErrMsg(err: unknown): string {
  return (err as any)?.data?.error ?? "Something went wrong";
}

export default function RoomLobby() {
  const { game } = useParams<{ game: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validGame = game as GameSlug;
  const listParams = { game: validGame, status: "waiting" as const };

  const { data: rooms = [], isLoading } = useListRooms(
    listParams,
    { query: { queryKey: getListRoomsQueryKey(listParams), enabled: !!validGame } }
  );

  const createRoom = useCreateRoom();
  const joinRoom = useJoinRoom();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomPlayers, setNewRoomPlayers] = useState("4");
  const [joinCode, setJoinCode] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }
    createRoom.mutate(
      { data: { game: validGame, name: newRoomName, maxPlayers: parseInt(newRoomPlayers, 10) } },
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
        onSuccess: () => {
          setLocation(`/rooms/${validGame}/${code}`);
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
      }
    );
  };

  const gameTitle = game?.replace(/-/g, " ").toUpperCase() || "LOBBY";

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/games")} data-testid="button-back">
            <ChevronLeft className="w-6 h-6" />
          </SoundButton>
          <h1 className="text-3xl font-bold font-mono tracking-widest text-primary">{gameTitle}</h1>
        </div>
        <div className="flex items-center gap-4">
          <SoundButton variant="outline" onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }} className="border-white/10" data-testid="button-show-join">
            <LogIn className="w-4 h-4 mr-2" /> JOIN BY CODE
          </SoundButton>
          <SoundButton onClick={() => {
            if (!isAuthenticated) setLocation("/auth");
            else { setShowCreate(!showCreate); setShowJoin(false); }
          }} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-show-host">
            <Plus className="w-4 h-4 mr-2" /> HOST ROOM
          </SoundButton>
        </div>
      </header>

      <div className="flex-1 flex flex-col gap-8">
        {showJoin && (
          <div className="p-6 bg-card/60 border border-white/10 rounded-xl">
            <form onSubmit={handleJoinByCode} className="flex gap-4">
              <Input
                placeholder="Enter Room Code or IP:Code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
                data-testid="input-join-code"
              />
              <SoundButton type="submit" disabled={joinRoom.isPending} data-testid="button-join-submit">
                {joinRoom.isPending ? "Joining..." : "JOIN"}
              </SoundButton>
            </form>
          </div>
        )}

        {showCreate && (
          <div className="p-6 bg-card/60 border border-white/10 rounded-xl">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required data-testid="input-create-name" />
                </div>
                <div className="space-y-2">
                  <Label>Max Players</Label>
                  <Input type="number" min="2" max="10" value={newRoomPlayers} onChange={(e) => setNewRoomPlayers(e.target.value)} required data-testid="input-create-max-players" />
                </div>
              </div>
              <SoundButton type="submit" disabled={createRoom.isPending} className="w-full bg-primary" data-testid="button-create-submit">
                {createRoom.isPending ? "Creating..." : "INITIALIZE ROOM"}
              </SoundButton>
            </form>
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-widest text-muted-foreground mb-6">OPEN ROOMS</h2>
          {isLoading ? (
            <div className="text-muted-foreground font-mono animate-pulse">SCANNING FREQUENCIES...</div>
          ) : rooms.length === 0 ? (
            <div className="text-muted-foreground font-mono">NO OPEN ROOMS FOUND. INITIATE ONE.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="p-6 bg-card/40 border border-white/5 rounded-xl hover:border-primary/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg truncate pr-4">{room.name}</h3>
                    <span className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-muted-foreground">{room.code}</span>
                  </div>
                  <div className="text-sm font-mono text-muted-foreground mb-6">
                    HOST: <span className="text-foreground">{room.hostUsername}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground font-mono">
                      <Users className="w-4 h-4 mr-2" />
                      {room.playerCount} / {room.maxPlayers}
                    </div>
                    <SoundButton 
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
                      className="border-primary/20 hover:bg-primary/20 text-primary"
                      data-testid={`button-join-${room.code}`}
                    >
                      JOIN
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
