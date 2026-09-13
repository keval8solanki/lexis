import { Hono, type Context } from 'hono'
import { Container } from './container'
import {
  CONTROLLER_PREFIX,
  MODULE_METADATA,
  PARAMS_METADATA,
  ROUTES_METADATA,
} from './metadata.keys'
import type { ModuleMetadata, ParamMetadata, RouteMetadata, Type } from './types'

export interface NestApplication extends Hono {
  container: Container
  getProvider<T>(token: any): T
}

export class NestFactory {
  static create(rootModule: Type): NestApplication {
    const container = new Container()
    const app = new Hono() as NestApplication
    app.container = container
    app.getProvider = <T>(token: any): T => container.get<T>(token)

    const controllers = new Set<Type>()
    this.loadModule(rootModule, container, controllers, new Set())
    this.registerControllers(app, container, controllers)

    return app
  }

  private static loadModule(
    moduleClass: Type,
    container: Container,
    controllers: Set<Type>,
    visited: Set<Type>
  ): void {
    if (visited.has(moduleClass)) return
    visited.add(moduleClass)

    const metadata: ModuleMetadata = Reflect.getMetadata(MODULE_METADATA, moduleClass) || {}

    // 1. Process imported modules
    if (metadata.imports) {
      for (const importedModule of metadata.imports) {
        this.loadModule(importedModule, container, controllers, visited)
      }
    }

    // 2. Register providers
    if (metadata.providers) {
      for (const provider of metadata.providers) {
        container.register(provider)
      }
    }

    // 3. Register controllers
    if (metadata.controllers) {
      for (const controller of metadata.controllers) {
        container.register(controller)
        controllers.add(controller)
      }
    }
  }

  private static registerControllers(app: Hono, container: Container, controllers: Set<Type>): void {
    for (const controllerClass of controllers) {
      const controllerInstance = container.get(controllerClass) as any
      const prefix: string = Reflect.getMetadata(CONTROLLER_PREFIX, controllerClass) || ''
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTES_METADATA, controllerClass) || []

      for (const route of routes) {
        const fullPath = this.combinePaths(prefix, route.path)
        const metadataKey = `${PARAMS_METADATA}:${String(route.methodName)}`
        const paramMetadata: ParamMetadata[] = Reflect.getMetadata(metadataKey, controllerClass) || []
        const handler = controllerInstance[route.methodName].bind(controllerInstance)

        const honoHandler = async (c: Context) => {
          let args: any[] = []

          if (paramMetadata.length > 0) {
            const sorted = [...paramMetadata].sort((a, b) => a.index - b.index)
            const maxIndex = Math.max(...sorted.map((p) => p.index))
            args = new Array(maxIndex + 1)

            for (const param of sorted) {
              switch (param.type) {
                case 'param':
                  args[param.index] = param.key ? c.req.param(param.key) : c.req.param()
                  break
                case 'query':
                  args[param.index] = param.key ? c.req.query(param.key) : c.req.query()
                  break
                case 'body': {
                  const contentType = c.req.header('content-type') || ''
                  let body: any
                  if (contentType.includes('application/json')) {
                    body = await c.req.json().catch(() => ({}))
                  } else {
                    body = await c.req.text().catch(() => '')
                  }
                  args[param.index] = param.key ? body?.[param.key] : body
                  break
                }
                case 'headers':
                  args[param.index] = param.key ? c.req.header(param.key) : c.req.header()
                  break
                case 'context':
                  args[param.index] = c
                  break
                case 'req':
                  args[param.index] = c.req
                  break
                case 'res':
                  args[param.index] = c.res
                  break
              }
            }
          } else if (handler.length > 0) {
            args = [c]
          }

          const result = await handler(...args)

          if (result instanceof Response) {
            return result
          }

          if (result === undefined) {
            return c.body(null, 204)
          }

          if (typeof result === 'object' && result !== null) {
            return c.json(result)
          }

          return c.text(String(result))
        }

        (app as any)[route.method](fullPath, honoHandler)
      }
    }
  }

  private static combinePaths(prefix: string, path: string): string {
    let cleanPrefix = prefix.trim()
    let cleanPath = path.trim()

    if (!cleanPrefix.startsWith('/') && cleanPrefix.length > 0) {
      cleanPrefix = '/' + cleanPrefix
    }
    if (cleanPrefix.endsWith('/')) {
      cleanPrefix = cleanPrefix.slice(0, -1)
    }

    if (!cleanPath.startsWith('/') && cleanPath.length > 0) {
      cleanPath = '/' + cleanPath
    }

    const full = cleanPrefix + cleanPath
    return full === '' ? '/' : full
  }
}
