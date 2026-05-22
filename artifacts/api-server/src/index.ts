import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

  db.update(roomsTable)
    .set({ status: "closed" })
    .where(eq(roomsTable.status, "waiting"))
    .then((result) => logger.info({ result }, "Closed stale waiting rooms on startup"))
    .catch((err) => logger.error({ err }, "Failed to close stale rooms on startup"));
});
