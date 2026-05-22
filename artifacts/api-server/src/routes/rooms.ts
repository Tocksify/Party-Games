import { Router } from "express";
import { db } from "@workspace/db";
import { roomsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { ListRoomsQueryParams, CreateRoomBody } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router = Router();

function formatRoom(room: typeof roomsTable.$inferSelect) {
  return {
    id: room.id,
    code: room.code,
    game: room.game,
    name: room.name,
    hostUsername: room.hostUsername,
    playerCount: room.playerCount,
    maxPlayers: room.maxPlayers,
    status: room.status,
    settings: room.settings ?? {},
    createdAt: room.createdAt.toISOString(),
  };
}

function generateCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

router.get("/rooms", async (req, res) => {
  const parse = ListRoomsQueryParams.safeParse(req.query);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { game, status } = parse.data;

  const conditions = [eq(roomsTable.game, game)];
  if (status) {
    conditions.push(eq(roomsTable.status, status));
  } else {
    conditions.push(eq(roomsTable.status, "waiting"));
  }

  const rooms = await db.select().from(roomsTable).where(and(...conditions)).orderBy(roomsTable.createdAt);
  res.json(rooms.map(formatRoom));
});

router.post("/rooms", requireAuth, async (req, res) => {
  const userId = req.userId!;

  const parse = CreateRoomBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { game, name, maxPlayers, settings } = parse.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const code = generateCode();
  const [room] = await db.insert(roomsTable).values({
    code,
    game,
    name,
    hostUserId: userId,
    hostUsername: user.username,
    maxPlayers,
    settings: settings ?? {},
    playerCount: 1,
    status: "waiting",
  }).returning();

  res.status(201).json(formatRoom(room));
});

router.get("/rooms/:code", async (req, res) => {
  const code = req.params["code"] as string;
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.code, code));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(formatRoom(room));
});

router.delete("/rooms/:code", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const code = req.params["code"] as string;

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.code, code));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.hostUserId !== userId) {
    res.status(403).json({ error: "Not the host" });
    return;
  }

  await db.update(roomsTable).set({ status: "closed" }).where(eq(roomsTable.code, code));
  res.json({ message: "Room closed" });
});

router.post("/rooms/:code/join", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const code = req.params["code"] as string;

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.code, code));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  if (room.status !== "waiting") {
    res.status(400).json({ error: "Room is not accepting players" });
    return;
  }
  if (room.playerCount >= room.maxPlayers) {
    res.status(400).json({ error: "Room is full" });
    return;
  }

  const [updated] = await db.update(roomsTable)
    .set({ playerCount: room.playerCount + 1 })
    .where(eq(roomsTable.code, code))
    .returning();

  res.json(formatRoom(updated));
});

export default router;
