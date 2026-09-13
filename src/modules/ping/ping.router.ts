import { Hono } from 'hono'
import { ping } from './ping.controller'

export const pingRouter = new Hono()

pingRouter.get("/", ping)
