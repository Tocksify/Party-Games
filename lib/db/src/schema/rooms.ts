import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  game: text("game").notNull(),
  name: text("name").notNull(),
  hostUserId: integer("host_user_id").notNull(),
  hostUsername: text("host_username").notNull(),
  playerCount: integer("player_count").notNull().default(1),
  maxPlayers: integer("max_players").notNull(),
  status: text("status").notNull().default("waiting"),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
