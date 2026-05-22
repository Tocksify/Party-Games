import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, roomsTable, chessGamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (_req, res) => {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [activeRooms] = await db.select({ count: sql<number>`count(*)::int` }).from(roomsTable)
    .where(eq(roomsTable.status, "waiting"));
  const [openChess] = await db.select({ count: sql<number>`count(*)::int` }).from(chessGamesTable)
    .where(eq(chessGamesTable.status, "open"));

  const signalRooms = await db.select({ count: sql<number>`count(*)::int` }).from(roomsTable)
    .where(eq(roomsTable.game, "the-signal"));
  const threadRooms = await db.select({ count: sql<number>`count(*)::int` }).from(roomsTable)
    .where(eq(roomsTable.game, "thread"));
  const blackboxRooms = await db.select({ count: sql<number>`count(*)::int` }).from(roomsTable)
    .where(eq(roomsTable.game, "blackbox"));

  res.json({
    totalUsers: userCount.count,
    activeRooms: activeRooms.count,
    openChessGames: openChess.count,
    gameBreakdown: {
      theSignal: signalRooms[0].count,
      thread: threadRooms[0].count,
      blackbox: blackboxRooms[0].count,
    },
  });
});

export default router;
