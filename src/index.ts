import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import api from "./api";

const app = new OpenAPIHono();
export default app;

// // @ts-expect-error
// import indexHtml from "./index.html";

// app.get("/", async (c) => {
//   return c.html(indexHtml);
// });

app.use("*", cors());

app.route("/api", api);

app.get("/api/ui", swaggerUI({ url: "/api/doc" }));
app.doc("/api/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Read Aloud Transit API",
  },
});
