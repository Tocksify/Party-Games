import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { roomsTable, chessGamesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  Promise.all([
    db.update(roomsTable)
      .set({ status: "closed" })
      .where(eq(roomsTable.status, "waiting")),
    db.update(chessGamesTable)
      .set({ status: "withdrawn" })
      .where(inArray(chessGamesTable.status, ["open", "pending"])),
  ])
    .then(() => logger.info("Cleaned up stale rooms and chess games on startup"))
    .catch((err) => logger.error({ err }, "Failed to clean up stale data on startup"));
});
