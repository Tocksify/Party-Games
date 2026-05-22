import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useGetChessGame, useCloseChessGame, useMakeChessMove, getGetChessGameQueryKey } from "@workspace/api-client-react";
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
  const closeGame = useCloseChessGame();
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const isHostRef = useRef(false);
  const gameIdRef = useRef(gameId);
  const gameStatusRef = useRef(game?.status);
  const alreadyClosedRef = useRef(false);

  const isHost = user && game && user.username === game.hostUsername;
  useEffect(() => { isHostRef.current = !!isHost; }, [isHost]);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { gameStatusRef.current = game?.status; }, [game?.status]);

  const doCloseGame = () => {
    const currentId = gameIdRef.current;
    if (!currentId || alreadyClosedRef.current || !isHostRef.current) return;
    if (gameStatusRef.current && !["open", "pending"].includes(gameStatusRef.current)) return;
    alreadyClosedRef.current = true;
    const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
    fetch(`${apiBase}/api/chess/games/${currentId}`, {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
  };

  useEffect(() => {
    const handleBeforeUnload = () => doCloseGame();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      doCloseGame();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-zinc-600 text-sm animate-pulse">
        Loading...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono text-red-500 gap-4">
        <div className="text-sm">Game not found.</div>
        <SoundButton onClick={() => setLocation("/chess")} className="bg-white text-black">Back to Lobby</SoundButton>
      </div>
    );
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
            toast({ variant: "destructive", title: "Invalid move", description: getErrMsg(err) });
            setSelectedSquare(null);
          }
        }
      );
    }
  };

  const handleWithdraw = () => {
    alreadyClosedRef.current = true;
    closeGame.mutate(
      { id: gameId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChessGameQueryKey(gameId) });
          setLocation("/chess");
        },
        onError: (err) => {
          alreadyClosedRef.current = false;
          toast({ variant: "destructive", title: "Error", description: getErrMsg(err) });
        }
      }
    );
  };

  const board = parseFen(game.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const isWhitePlayer = user?.username === game.hostUsername;
  const isTurn = (isWhitePlayer && game.currentTurn === "white") || (!isWhitePlayer && game.currentTurn === "black");

  return (
    <PageTransition className="min-h-screen bg-black p-6 md:p-12 flex flex-col relative z-10 items-center">
      <header className="w-full max-w-4xl flex items-center justify-between mb-8">
        <SoundButton variant="ghost" size="icon" onClick={() => setLocation("/chess")} className="text-zinc-400 hover:bg-zinc-900" data-testid="button-back">
          <ChevronLeft className="w-5 h-5" />
        </SoundButton>
        <div className="text-center font-mono">
          <div className="text-white font-bold tracking-widest">
            {game.hostUsername} <span className="text-zinc-600">vs</span> {game.opponentUsername || "..."}
          </div>
          <div className="text-xs text-zinc-600 mt-1">
            {game.status.toUpperCase()}
            {game.winner && <span className="ml-3 text-white font-bold">Winner: {game.winner}</span>}
          </div>
        </div>
        {isHost && ["open", "pending"].includes(game.status) && (
          <SoundButton
            variant="outline"
            size="sm"
            onClick={handleWithdraw}
            disabled={closeGame.isPending}
            className="border-zinc-800 text-zinc-500 hover:border-zinc-600"
          >
            Withdraw
          </SoundButton>
        )}
        {(!isHost || !["open", "pending"].includes(game.status)) && <div className="w-10" />}
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="text-sm font-mono tracking-widest text-zinc-500">
          {game.status === "active" ? (
            <span className={isTurn ? "text-white" : "text-zinc-600"}>
              {game.currentTurn?.toUpperCase()} to move{isTurn ? " — your turn" : ""}
            </span>
          ) : game.status === "open" ? (
            <span className="text-zinc-500">Waiting for opponent...</span>
          ) : game.status === "pending" ? (
            <span className="text-zinc-500">Challenger pending response...</span>
          ) : (
            <span className="text-zinc-500">Game over</span>
          )}
        </div>

        <div className="border-4 border-zinc-800 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 w-[360px] h-[360px] sm:w-[560px] sm:h-[560px]">
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
                      flex items-center justify-center text-3xl sm:text-5xl cursor-pointer select-none transition-colors
                      ${isLight ? "bg-zinc-700" : "bg-zinc-900"}
                      ${isSelected ? "bg-white/30" : "hover:bg-white/10"}
                    `}
                    data-testid={`square-${squareName}`}
                  >
                    <span style={{ color: piece === piece.toUpperCase() && piece !== "" ? "#fff" : "#888", textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
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
  const [position] = fen.split(" ");
  const rows = position.split("/");
  return rows.map(row => {
    const boardRow: string[] = [];
    for (const char of row) {
      if (isNaN(parseInt(char, 10))) {
        boardRow.push(char);
      } else {
        for (let i = 0; i < parseInt(char, 10); i++) {
          boardRow.push("");
        }
      }
    }
    return boardRow;
  });
}

function pieceToUnicode(piece: string): string {
  const map: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙",
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟",
    "": "",
  };
  return map[piece] || "";
}
