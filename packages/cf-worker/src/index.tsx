import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

import api from "./api";
const app = new OpenAPIHono();

app.get("/", async (c) => {
  const res = await fetch(
    "https://raw.githubusercontent.com/yy4382/read-aloud/refs/heads/main/packages/cf-worker/src/index.html",
  );

  return c.html(await res.text());
});

app.route("/api", api);

export default app;
app.get("/robots.txt", (c) => c.text("User-agent: *\nDisallow: /"));
app.get("/api/ui", swaggerUI({ url: "/api/doc" }));
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Read Aloud Transit API",
  },
});
