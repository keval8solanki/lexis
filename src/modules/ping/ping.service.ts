import { Injectable } from '@core'


export interface PingResponse {
  message: string
}

@Injectable()
export class PingService {
  ping(): PingResponse {
    return {
      message: 'pong',
    }
  }

  getPing(): PingResponse {
    return this.ping()
  }
}
