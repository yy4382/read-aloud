import { handle } from "hono/vercel";
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

export default app;
