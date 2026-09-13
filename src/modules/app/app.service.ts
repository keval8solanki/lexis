import { Injectable } from '@core'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello Hono!'
  }
}
