import 'reflect-metadata'
import { NestFactory } from '@core'
import { AppModule } from '@/app'

export const app = NestFactory.create(AppModule)

export default app
