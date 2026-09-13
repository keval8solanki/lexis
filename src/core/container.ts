import 'reflect-metadata'
import { CUSTOM_INJECT_TOKENS } from './metadata.keys'
import type { ClassProvider, FactoryProvider, InjectionToken, Provider, Type, ValueProvider } from './types'

export class Container {
  private providers = new Map<InjectionToken, Provider>()
  private instances = new Map<InjectionToken, any>()
  private resolving = new Set<InjectionToken>()

  register<T>(provider: Provider<T>): void {
    const token = this.getToken(provider)
    this.providers.set(token, provider)
  }

  registerInstance<T>(token: InjectionToken<T>, instance: T): void {
    this.instances.set(token, instance)
  }

  has(token: InjectionToken): boolean {
    return this.instances.has(token) || this.providers.has(token)
  }

  get<T>(token: InjectionToken<T>): T {
    if (this.instances.has(token)) {
      return this.instances.get(token)
    }

    if (this.resolving.has(token)) {
      throw new Error(`Circular dependency detected while resolving token: ${this.getTokenName(token)}`)
    }

    this.resolving.add(token)
    try {
      const provider = this.providers.get(token)
      if (!provider) {
        if (typeof token === 'function') {
          const instance = this.instantiate(token as Type<T>)
          this.instances.set(token, instance)
          return instance
        }
        throw new Error(`No provider found for token: ${this.getTokenName(token)}`)
      }

      const instance = this.resolveProvider(provider)
      this.instances.set(token, instance)
      return instance
    } finally {
      this.resolving.delete(token)
    }
  }

  private resolveProvider<T>(provider: Provider<T>): T {
    if (typeof provider === 'function') {
      return this.instantiate(provider)
    }

    if ('useValue' in provider) {
      return (provider as ValueProvider<T>).useValue
    }

    if ('useClass' in provider) {
      return this.instantiate((provider as ClassProvider<T>).useClass)
    }

    if ('useFactory' in provider) {
      const factoryProvider = provider as FactoryProvider<T>
      const deps = (factoryProvider.inject || []).map((dep) => this.get(dep))
      return factoryProvider.useFactory(...deps)
    }

    throw new Error(`Invalid provider definition: ${JSON.stringify(provider)}`)
  }

  instantiate<T>(target: Type<T>): T {
    const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', target) || []
    const customTokens: Record<number, InjectionToken> = Reflect.getMetadata(CUSTOM_INJECT_TOKENS, target) || {}

    const args = paramTypes.map((paramType, index) => {
      const token = customTokens[index] ?? paramType
      if (!token) {
        throw new Error(
          `Cannot resolve parameter at index ${index} of ${target.name}. Ensure dependency injection decorators are applied.`
        )
      }
      return this.get(token)
    })

    return new target(...args)
  }

  private getToken<T>(provider: Provider<T>): InjectionToken<T> {
    if (typeof provider === 'function') {
      return provider
    }
    return provider.provide
  }

  private getTokenName(token: InjectionToken): string {
    if (typeof token === 'function') {
      return token.name
    }
    if (typeof token === 'symbol') {
      return token.toString()
    }
    return String(token)
  }
}
