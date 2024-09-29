import { OpenAPIHono } from "@hono/zod-openapi";
import synthesis from "./synthesis";
const api = new OpenAPIHono();
api.route("/synthesis", synthesis);
export default api;
