import { useLocation } from "wouter";
import { useListChessGames, useOpenChessGame, useRequestChessGame, useRespondChessRequest, getListChessGamesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Swords } from "lucide-react";

function getErrMsg(err: unknown): string {
  return (err as any)?.response?.data?.error ?? "Something went wrong";
}

export default function ChessLobby() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
          toast({ title: "Request Sent", description: "Waiting for host to accept..." });
        },
        onError: (err) => toast({ variant: "destructive", title: "Error", description: getErrMsg(err) })
      }
    );
  };

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/games")} data-testid="button-back">
            <ChevronLeft className="w-6 h-6" />
          </SoundButton>
          <h1 className="text-3xl font-bold font-mono tracking-widest text-[#FFC107]">CHESS LOBBY</h1>
        </div>
        <SoundButton 
          onClick={handleOpenGame} 
          disabled={openGame.isPending}
          className="bg-[#FFC107] hover:bg-[#FFC107]/90 text-black font-bold"
          data-testid="button-open-game"
        >
          <PlusIcon className="w-4 h-4 mr-2" /> OPEN A GAME
        </SoundButton>
      </header>

      <div className="flex-1">
        <h2 className="text-xl font-bold tracking-widest text-muted-foreground mb-6">OPEN CHALLENGES</h2>
        {isLoading ? (
          <div className="text-muted-foreground font-mono animate-pulse">SCANNING FOR OPPONENTS...</div>
        ) : games.length === 0 ? (
          <div className="text-muted-foreground font-mono">NO OPEN GAMES. BE THE FIRST.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map(game => {
              const isHost = user?.username === game.hostUsername;
              const hasChallenger = !!game.challengerUsername;
              
              return (
                <div key={game.id} className="p-6 bg-card/40 border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground font-mono mb-1">HOST</div>
                    <div className="font-bold text-lg">{game.hostUsername}</div>
                    <div className="text-xs font-mono mt-2 opacity-70">STATUS: {game.status}</div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isHost && hasChallenger ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-xs font-mono text-primary text-center">Challenger: {game.challengerUsername}</div>
                        <div className="flex gap-2">
                          <SoundButton 
                            size="sm"
                            className="bg-primary text-primary-foreground"
                            onClick={() => respondRequest.mutate({ id: game.id, data: { accept: true, challengerUsername: game.challengerUsername! } }, {
                              onSuccess: () => setLocation(`/chess/${game.id}`)
                            })}
                          >
                            ACCEPT
                          </SoundButton>
                          <SoundButton 
                            size="sm"
                            variant="destructive"
                            onClick={() => respondRequest.mutate({ id: game.id, data: { accept: false, challengerUsername: game.challengerUsername! } }, {
                              onSuccess: () => queryClient.invalidateQueries({ queryKey: getListChessGamesQueryKey() })
                            })}
                          >
                            DECLINE
                          </SoundButton>
                        </div>
                      </div>
                    ) : isHost ? (
                      <SoundButton variant="outline" disabled onClick={() => setLocation(`/chess/${game.id}`)}>WAITING...</SoundButton>
                    ) : (
                      <SoundButton 
                        onClick={() => handleRequest(game.id)}
                        disabled={requestGame.isPending || game.status !== 'open'}
                        className="bg-white/10 hover:bg-white/20"
                        data-testid={`button-request-${game.id}`}
                      >
                        <Swords className="w-4 h-4 mr-2" /> REQUEST
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}
