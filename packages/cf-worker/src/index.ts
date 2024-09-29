import { Hono } from "hono";

import api from "./api";
const app = new Hono();

app.get("/", async (c) => {
  return c.text("Hello World!");
});
app.route("/api", api);

export default app;
