import { Hono } from 'hono'
import type { PingController } from './ping.controller'

export function createPingRouter(pingController: PingController): Hono {
  const router = new Hono()
  router.get('/', (c) => c.json(pingController.ping()))
  return router
}
