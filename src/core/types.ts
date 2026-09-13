import type { Context } from 'hono'

export type Type<T = any> = new (...args: any[]) => T
export type AbstractType<T = any> = abstract new (...args: any[]) => T
export type InjectionToken<T = any> = string | symbol | Type<T> | AbstractType<T>

export interface ClassProvider<T = any> {
  provide: InjectionToken<T>
  useClass: Type<T>
}

export interface ValueProvider<T = any> {
  provide: InjectionToken<T>
  useValue: T
}

export interface FactoryProvider<T = any> {
  provide: InjectionToken<T>
  useFactory: (...args: any[]) => T
  inject?: InjectionToken[]
}

export type Provider<T = any> = Type<T> | ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>

export interface ModuleMetadata {
  imports?: any[]
  controllers?: Type[]
  providers?: Provider[]
  exports?: (InjectionToken | Provider)[]
}

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all'

export interface RouteMetadata {
  method: HttpMethod
  path: string
  methodName: string | symbol
}

export type ParamType = 'param' | 'query' | 'body' | 'headers' | 'context' | 'req' | 'res'

export interface ParamMetadata {
  index: number
  type: ParamType
  key?: string
}
