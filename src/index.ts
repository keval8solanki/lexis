import { Hono } from 'hono'
import { pingRouter } from './modules/ping'

const app = new Hono()

app.route('/ping', pingRouter)

export default app
