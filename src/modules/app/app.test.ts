import { describe, expect, it } from 'bun:test'
import 'reflect-metadata'
import { NestFactory } from '@/core'
import { AppController, AppModule, AppService } from '@/modules/app'
import defaultApp from '@/index'

describe('AppService', () => {
  it('should return hello message', () => {
    const service = new AppService()
    expect(service.getHello()).toBe('Hello Hono!')
  })
})

describe('AppController', () => {
  it('should return hello message via injected service', () => {
    const service = new AppService()
    const controller = new AppController(service)
    expect(controller.getHello()).toBe('Hello Hono!')
  })
})

describe('AppModule Integration', () => {
  it('should respond to GET / via AppController', async () => {
    const res = await defaultApp.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Hello Hono!')
  })

  it('should respond to GET /ping via imported PingModule', async () => {
    const res = await defaultApp.request('/ping')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ message: 'pong' })
  })

  it('should allow resolving AppController and AppService from container', () => {
    const app = NestFactory.create(AppModule)
    const controller = app.getProvider(AppController)
    const service = app.getProvider(AppService)

    expect(controller).toBeInstanceOf(AppController)
    expect(service).toBeInstanceOf(AppService)
  })
})
