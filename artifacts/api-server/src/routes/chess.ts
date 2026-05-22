import { Router } from "express";
import { db } from "@workspace/db";
import { chessGamesTable, usersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { RespondChessRequestBody, MakeChessMoveBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

function formatGame(game: typeof chessGamesTable.$inferSelect) {
  return {
    id: game.id,
    hostUsername: game.hostUsername,
    opponentUsername: game.opponentUsername ?? null,
    challengerUsername: game.challengerUsername ?? null,
    status: game.status,
    fen: game.fen ?? null,
    currentTurn: (game.currentTurn as "white" | "black" | null) ?? null,
    winner: game.winner ?? null,
    createdAt: game.createdAt.toISOString(),
  };
}

router.get("/chess/games", async (req, res) => {
  const games = await db.select().from(chessGamesTable)
    .where(inArray(chessGamesTable.status, ["open", "pending"]))
    .orderBy(chessGamesTable.createdAt);
  res.json(games.map(formatGame));
});

router.post("/chess/games", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  await db.update(chessGamesTable)
    .set({ status: "withdrawn" })
    .where(and(
      eq(chessGamesTable.hostUserId, userId),
      inArray(chessGamesTable.status, ["open", "pending"]),
    ));

  const [game] = await db.insert(chessGamesTable).values({
    hostUserId: userId,
    hostUsername: user.username,
    status: "open",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    currentTurn: "white",
  }).returning();

  res.status(201).json(formatGame(game));
});

router.delete("/chess/games/mine", requireAuth, async (req, res) => {
  const userId = req.userId!;
  await db.update(chessGamesTable)
    .set({ status: "withdrawn" })
    .where(and(
      eq(chessGamesTable.hostUserId, userId),
      inArray(chessGamesTable.status, ["open", "pending"]),
    ));
  res.json({ message: "Games withdrawn" });
});

router.get("/chess/games/:id", async (req, res) => {
  const id = parseInt(req.params["id"] as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid game ID" });
    return;
  }

  const [game] = await db.select().from(chessGamesTable).where(eq(chessGamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(formatGame(game));
});

router.delete("/chess/games/:id", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params["id"] as string);

  const [game] = await db.select().from(chessGamesTable).where(eq(chessGamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.hostUserId !== userId) {
    res.status(403).json({ error: "Not the host" });
    return;
  }

  await db.update(chessGamesTable).set({ status: "withdrawn" }).where(eq(chessGamesTable.id, id));
  res.json({ message: "Game withdrawn" });
});

router.post("/chess/games/:id/request", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params["id"] as string);

  const [game] = await db.select().from(chessGamesTable).where(eq(chessGamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.status !== "open") {
    res.status(409).json({ error: "Game is not open for challenges" });
    return;
  }
  if (game.hostUserId === userId) {
    res.status(400).json({ error: "Cannot challenge your own game" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (game.challengerUserId === userId) {
    res.status(409).json({ error: "Already requested to join" });
    return;
  }

  await db.update(chessGamesTable)
    .set({ challengerUserId: userId, challengerUsername: user.username, status: "pending" })
    .where(eq(chessGamesTable.id, id));

  res.json({ message: "Request sent" });
});

router.post("/chess/games/:id/respond", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params["id"] as string);

  const [game] = await db.select().from(chessGamesTable).where(eq(chessGamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.hostUserId !== userId) {
    res.status(403).json({ error: "Not the host" });
    return;
  }

  const parse = RespondChessRequestBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { accept } = parse.data;

  if (accept) {
    const [updated] = await db.update(chessGamesTable)
      .set({
        opponentUserId: game.challengerUserId,
        opponentUsername: game.challengerUsername,
        challengerUserId: null,
        challengerUsername: null,
        status: "active",
      })
      .where(eq(chessGamesTable.id, id))
      .returning();
    res.json(formatGame(updated));
  } else {
    const [updated] = await db.update(chessGamesTable)
      .set({ challengerUserId: null, challengerUsername: null, status: "open" })
      .where(eq(chessGamesTable.id, id))
      .returning();
    res.json(formatGame(updated));
  }
});

router.post("/chess/games/:id/move", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const id = parseInt(req.params["id"] as string);

  const [game] = await db.select().from(chessGamesTable).where(eq(chessGamesTable.id, id));
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  if (game.status !== "active") {
    res.status(400).json({ error: "Game is not active" });
    return;
  }

  const parse = MakeChessMoveBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid move format" });
    return;
  }

  const isWhite = game.currentTurn === "white";
  const isHostTurn = isWhite;
  const isPlayerHost = game.hostUserId === userId;
  const isPlayerOpponent = game.opponentUserId === userId;

  if (isHostTurn && !isPlayerHost) {
    res.status(400).json({ error: "Not your turn" });
    return;
  }
  if (!isHostTurn && !isPlayerOpponent) {
    res.status(400).json({ error: "Not your turn" });
    return;
  }

  const nextTurn = isWhite ? "black" : "white";
  const [updated] = await db.update(chessGamesTable)
    .set({ currentTurn: nextTurn })
    .where(eq(chessGamesTable.id, id))
    .returning();

  res.json(formatGame(updated));
});

export default router;
