import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetChessGame, useMakeChessMove, getGetChessGameQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageTransition } from "@/components/page-transition";
import { SoundButton } from "@/components/sound-button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

function getErrMsg(err: unknown): string {
  return (err as any)?.data?.error ?? "Something went wrong";
}

export default function ChessGame() {
  const { id } = useParams<{ id: string }>();
  const gameId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: game, isLoading } = useGetChessGame(gameId, {
    query: {
      queryKey: getGetChessGameQueryKey(gameId),
      enabled: !!gameId,
      refetchInterval: 2000,
    }
  });

  const makeMove = useMakeChessMove();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center font-mono animate-pulse">INITIALIZING BOARD...</div>;
  }

  if (!game) {
    return <div className="min-h-screen flex items-center justify-center font-mono text-destructive">GAME NOT FOUND</div>;
  }

  const handleSquareClick = (square: string) => {
    if (game.status !== "active") return;
    
    if (!selectedSquare) {
      setSelectedSquare(square);
    } else {
      const moveStr = `${selectedSquare}${square}`;
      makeMove.mutate(
        { id: gameId, data: { move: moveStr } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetChessGameQueryKey(gameId) });
            setSelectedSquare(null);
          },
          onError: (err) => {
            toast({ variant: "destructive", title: "Invalid Move", description: getErrMsg(err) });
            setSelectedSquare(null);
          }
        }
      );
    }
  };

  const board = parseFen(game.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const isWhite = user?.username === game.hostUsername;
  const isTurn = (isWhite && game.currentTurn === 'white') || (!isWhite && game.currentTurn === 'black');

  return (
    <PageTransition className="min-h-screen p-6 md:p-12 flex flex-col relative z-10 items-center">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/chess")} data-testid="button-back">
          <ChevronLeft className="w-6 h-6" />
        </SoundButton>
        <div className="text-center font-mono">
          <div className="text-[#FFC107] font-bold tracking-widest">{game.hostUsername} VS {game.opponentUsername || "..."}</div>
          <div className="text-sm text-muted-foreground mt-2">
            STATUS: <span className="text-white">{game.status.toUpperCase()}</span>
            {game.winner && <span className="ml-4 text-primary font-bold">WINNER: {game.winner}</span>}
          </div>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="flex flex-col items-center gap-8">
        <div className="text-xl font-mono tracking-widest">
          {game.status === 'active' ? (
            <span className={isTurn ? "text-primary animate-pulse" : "text-muted-foreground"}>
              {game.currentTurn?.toUpperCase()} TO MOVE
            </span>
          ) : (
            <span className="text-muted-foreground">MATCH CONCLUDED</span>
          )}
        </div>

        <div className="border-[12px] border-card rounded-lg overflow-hidden shadow-[0_0_50px_rgba(255,193,7,0.1)]">
          <div className="grid grid-cols-8 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px]">
            {board.map((row, r) => 
              row.map((piece, c) => {
                const squareName = `${String.fromCharCode(97 + c)}${8 - r}`;
                const isLight = (r + c) % 2 === 0;
                const isSelected = selectedSquare === squareName;
                
                return (
                  <div 
                    key={squareName}
                    onClick={() => handleSquareClick(squareName)}
                    className={`
                      flex items-center justify-center text-4xl sm:text-6xl cursor-pointer select-none transition-colors
                      ${isLight ? 'bg-[#D18B47]/20' : 'bg-[#FFCE9E]/20'}
                      ${isSelected ? 'bg-primary/50' : ''}
                      hover:bg-white/20
                    `}
                    data-testid={`square-${squareName}`}
                  >
                    <span className="drop-shadow-lg" style={{ color: piece === piece.toUpperCase() && piece !== '' ? '#fff' : '#aaa', textShadow: '0 0 5px rgba(255,255,255,0.3)' }}>
                      {pieceToUnicode(piece)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function parseFen(fen: string): string[][] {
  const [position] = fen.split(' ');
  const rows = position.split('/');
  return rows.map(row => {
    const boardRow: string[] = [];
    for (const char of row) {
      if (isNaN(parseInt(char, 10))) {
        boardRow.push(char);
      } else {
        for (let i = 0; i < parseInt(char, 10); i++) {
          boardRow.push('');
        }
      }
    }
    return boardRow;
  });
}

function pieceToUnicode(piece: string): string {
  const map: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
    '': ''
  };
  return map[piece] || '';
}
