import 'reflect-metadata'
import {
  CONTROLLER_PREFIX,
  CONTROLLER_WATERMARK,
  CUSTOM_INJECT_TOKENS,
  INJECTABLE_WATERMARK,
  MODULE_METADATA,
  PARAMS_METADATA,
  ROUTES_METADATA,
} from './metadata.keys'
import type { HttpMethod, InjectionToken, ModuleMetadata, ParamMetadata, ParamType, RouteMetadata } from './types'

export function Injectable(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(INJECTABLE_WATERMARK, true, target)
  }
}

export function Controller(prefix: string = ''): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(CONTROLLER_WATERMARK, true, target)
    Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target)
  }
}

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target)
  }
}

function createMethodDecorator(method: HttpMethod) {
  return (path: string = ''): MethodDecorator => {
    return (target: any, propertyKey: string | symbol) => {
      const existingRoutes: RouteMetadata[] = Reflect.getMetadata(ROUTES_METADATA, target.constructor) || []
      existingRoutes.push({ method, path, methodName: propertyKey })
      Reflect.defineMetadata(ROUTES_METADATA, existingRoutes, target.constructor)
    }
  }
}

export const Get = createMethodDecorator('get')
export const Post = createMethodDecorator('post')
export const Put = createMethodDecorator('put')
export const Delete = createMethodDecorator('delete')
export const Patch = createMethodDecorator('patch')
export const All = createMethodDecorator('all')

function createParamDecorator(type: ParamType) {
  return (key?: string): ParameterDecorator => {
    return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
      if (!propertyKey) return
      const metadataKey = `${PARAMS_METADATA}:${String(propertyKey)}`
      const existingParams: ParamMetadata[] = Reflect.getMetadata(metadataKey, target.constructor) || []
      existingParams.push({ index: parameterIndex, type, key })
      Reflect.defineMetadata(metadataKey, existingParams, target.constructor)
    }
  }
}

export const Param = createParamDecorator('param')
export const Query = createParamDecorator('query')
export const Body = createParamDecorator('body')
export const Headers = createParamDecorator('headers')
export const Ctx = createParamDecorator('context')
export const Context = Ctx
export const Req = createParamDecorator('req')
export const Res = createParamDecorator('res')

export function Inject(token: InjectionToken): ParameterDecorator {
  return (target: any, _propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingTokens: Record<number, InjectionToken> = Reflect.getMetadata(CUSTOM_INJECT_TOKENS, target) || {}
    existingTokens[parameterIndex] = token
    Reflect.defineMetadata(CUSTOM_INJECT_TOKENS, existingTokens, target)
  }
}
