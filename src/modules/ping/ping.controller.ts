import { Context } from "hono";

export function ping(c: Context) {
  return c.text("pong")
}
