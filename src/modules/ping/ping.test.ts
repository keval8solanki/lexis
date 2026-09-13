import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import defaultApp from '@/index'
import { Controller, Get, Injectable, Module, NestFactory, Param, Query } from '@core'
import { PingController, PingModule, PingService } from '@/ping'


describe('PingService (NestJS-style)', () => {
  it('should return ping message', () => {
    const service = new PingService()
    expect(service.ping()).toEqual({ message: 'pong' })
    expect(service.getPing()).toEqual({ message: 'pong' })
  })
})

describe('PingController with DI (NestJS-style)', () => {
  it('should automatically inject PingService into PingController', async () => {
    const app = NestFactory.create(PingModule)

    const controller = app.getProvider(PingController)
    const service = app.getProvider(PingService)

    expect(controller).toBeInstanceOf(PingController)
    expect(service).toBeInstanceOf(PingService)

    const res = await app.request('/ping')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual({ message: 'pong' })
  })

  it('should support custom provider overrides for testing', async () => {
    @Injectable()
    class MockPingService extends PingService {
      override ping() {
        return { message: 'mocked-ping' }
      }
    }

    @Module({
      controllers: [PingController],
      providers: [
        {
          provide: PingService,
          useClass: MockPingService,
        },
      ],
    })
    class TestPingModule { }

    const app = NestFactory.create(TestPingModule)
    const res = await app.request('/ping')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'mocked-ping' })
  })
})

describe('Advanced NestJS-style decorators', () => {
  it('should support @Param and @Query parameter decorators', async () => {
    @Controller('echo')
    class EchoController {
      @Get(':id')
      getById(@Param('id') id: string, @Query('suffix') suffix?: string) {
        return {
          id,
          suffix: suffix ?? null,
        }
      }
    }

    @Module({
      controllers: [EchoController],
    })
    class EchoModule { }

    const app = NestFactory.create(EchoModule)
    const res = await app.request('/echo/42?suffix=test')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: '42',
      suffix: 'test',
    })
  })
})

describe('App Integration', () => {
  it('should respond to GET / and GET /ping on main app', async () => {
    const rootRes = await defaultApp.request('/')
    expect(rootRes.status).toBe(200)
    expect(await rootRes.text()).toBe('Hello Hono!')

    const pingRes = await defaultApp.request('/ping')
    expect(pingRes.status).toBe(200)
    expect(await pingRes.json()).toEqual({ message: 'pong' })
  })
})
