import { serve } from "@hono/node-server";
import app from "../src";

if (process.env.TOKEN)
  console.log(`Running with token: ${globalThis.process.env.TOKEN}`);
else
  console.warn(
    "Running without token, please consider set TOKEN in environment variables",
  );

serve(app);
