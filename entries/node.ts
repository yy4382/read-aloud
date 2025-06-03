import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import app from "../src";

declare global {
  var DEBUG: boolean;
}

if (process.env.TOKEN)
  console.info(`Running with token: ${globalThis.process.env.TOKEN}`);
else
  console.warn(
    "Running without token, please consider set TOKEN in environment variables",
  );

app.use("*", serveStatic({ root: "./public" }));

serve(app);
