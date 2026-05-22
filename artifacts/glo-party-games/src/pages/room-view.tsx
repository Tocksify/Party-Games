import { useLocation, useParams } from "wouter";
import { useGetRoom, useCloseRoom, getGetRoomQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Users, ShieldAlert } from "lucide-react";

export default function RoomView() {
  const { game, code } = useParams<{ game: string; code: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: room, isLoading } = useGetRoom(code || "", {
    query: {
      enabled: !!code,
      refetchInterval: 5000,
    }
  });

  const closeRoom = useCloseRoom();

  const isHost = user && room && user.username === room.hostUsername;

  const handleClose = () => {
    if (!code) return;
    closeRoom.mutate(
      { code },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRoomQueryKey(code) });
          setLocation(`/rooms/${game}`);
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: err.error })
      }
    );
  };

  const handleLeave = () => {
    // In a real app we'd have a leave room mutation, but for this spec we can just navigate away
    setLocation(`/rooms/${game}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-muted-foreground animate-pulse">
        CONNECTING TO ROOM...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-mono text-destructive gap-4">
        <div>ROOM NOT FOUND OR DISCONNECTED</div>
        <SoundButton onClick={() => setLocation(`/rooms/${game}`)}>RETURN TO LOBBY</SoundButton>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 max-w-6xl mx-auto flex flex-col relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <SoundButton variant="ghost" size="icon" onClick={handleLeave} data-testid="button-back">
            <ChevronLeft className="w-6 h-6" />
          </SoundButton>
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-widest text-primary">{room.name}</h1>
            <div className="text-sm font-mono text-muted-foreground mt-1">
              GAME: {room.game.toUpperCase()} • CODE: <span className="text-white bg-white/10 px-2 py-0.5 rounded">{room.code}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SoundButton variant="outline" onClick={handleLeave} data-testid="button-leave">
            LEAVE
          </SoundButton>
          {isHost && (
            <SoundButton 
              variant="destructive" 
              onClick={handleClose}
              disabled={closeRoom.isPending}
              data-testid="button-close-room"
            >
              <ShieldAlert className="w-4 h-4 mr-2" /> CLOSE ROOM
            </SoundButton>
          )}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 p-8 bg-card/40 border border-white/5 rounded-xl backdrop-blur-sm flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4 animate-pulse">
              <Users className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold tracking-widest text-foreground">AWAITING PLAYERS</h2>
            <div className="text-muted-foreground font-mono">
              Waiting for host to initiate the game sequence...
            </div>
            <div className="mt-8 font-mono text-sm bg-black/50 p-4 rounded border border-white/5 inline-block">
              {room.playerCount} / {room.maxPlayers} CONNECTED
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-6 bg-card/40 border border-white/5 rounded-xl">
            <h3 className="font-bold tracking-widest text-muted-foreground mb-4 text-sm">ROOM INFO</h3>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">HOST</span>
                <span className="text-primary">{room.hostUsername}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">STATUS</span>
                <span className="text-foreground">{room.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CREATED</span>
                <span className="text-foreground">{new Date(room.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
