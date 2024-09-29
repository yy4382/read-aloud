import { Hono } from "hono";
import synthesis from "./synthesis";
const api = new Hono();
api.route("/synthesis", synthesis);
export default api;
