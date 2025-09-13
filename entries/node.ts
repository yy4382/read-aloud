import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "../src";
import logger from "../src/lib/utils/logger";

if (process.env.TOKEN)
  logger.info(`Running with token: ${globalThis.process.env.TOKEN}`);
else
  logger.warn(
    "Running without token, please consider set TOKEN in environment variables",
  );

app.use("*", serveStatic({ root: "./public" }));

const server = serve(app);

logger.info("Server is running on http://localhost:3000");

// graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
