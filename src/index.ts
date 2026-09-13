import { Hono } from 'hono'
import { pingRouter } from '@/ping'

const app = new Hono()

app.route('/ping', pingRouter)

export default app
