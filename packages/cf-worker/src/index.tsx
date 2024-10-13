import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { Home } from "./home";

import api from "./api";
const app = new OpenAPIHono();

app.get("/", async (c) => {
  return c.html(<Home />);
});

app.route("/api", api);

export default app;
app.get("/api/ui", swaggerUI({ url: "/api/doc" }));
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Read Aloud Transit API",
  },
});
