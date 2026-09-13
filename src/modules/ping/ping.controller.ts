import { Controller, Get } from '@core'

import { PingService, type PingResponse } from './ping.service'

@Controller('ping')
export class PingController {
  constructor(private readonly pingService: PingService) { }

  @Get()
  ping(): PingResponse {
    return this.pingService.ping()
  }
}
