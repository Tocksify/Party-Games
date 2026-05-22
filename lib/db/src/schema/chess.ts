import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chessGamesTable = pgTable("chess_games", {
  id: serial("id").primaryKey(),
  hostUserId: integer("host_user_id").notNull(),
  hostUsername: text("host_username").notNull(),
  opponentUserId: integer("opponent_user_id"),
  opponentUsername: text("opponent_username"),
  challengerUserId: integer("challenger_user_id"),
  challengerUsername: text("challenger_username"),
  status: text("status").notNull().default("open"),
  fen: text("fen").default("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
  currentTurn: text("current_turn").default("white"),
  winner: text("winner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChessGameSchema = createInsertSchema(chessGamesTable).omit({ id: true, createdAt: true });
export type InsertChessGame = z.infer<typeof insertChessGameSchema>;
export type ChessGame = typeof chessGamesTable.$inferSelect;
