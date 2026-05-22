import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { RegisterBody, LoginBody, LoginAsGuestBody, UpdateUsernameBody } from "@workspace/api-zod";
import { signToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";

const router = Router();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
}

function formatUser(user: typeof usersTable.$inferSelect, token: string) {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    isGuest: user.isGuest,
    createdAt: user.createdAt.toISOString(),
    token,
  };
}

router.post("/auth/register", async (req, res) => {
  const parse = RegisterBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { username, email, password } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }
  const existingEmail = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash: hashPassword(password),
    isGuest: false,
  }).returning();

  const token = signToken(user.id);
  res.status(201).json(formatUser(user, token));
});

router.post("/auth/login", async (req, res) => {
  const parse = LoginBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parse.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken(user.id);
  res.json(formatUser(user, token));
});

router.post("/auth/guest", async (req, res) => {
  const parse = LoginAsGuestBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    username,
    isGuest: true,
  }).returning();

  const token = signToken(user.id);
  res.json(formatUser(user, token));
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (user?.isGuest) {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
  }
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { token: _token, ...userWithoutToken } = formatUser(user, "");
  res.json(userWithoutToken);
});

router.patch("/auth/me/username", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const parse = UpdateUsernameBody.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Invalid username" });
    return;
  }
  const { username } = parse.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing.length > 0 && existing[0].id !== userId) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [user] = await db.update(usersTable).set({ username }).where(eq(usersTable.id, userId)).returning();
  const { token: _token, ...userWithoutToken } = formatUser(user, "");
  res.json(userWithoutToken);
});

export default router;
