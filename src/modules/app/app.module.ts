import { Module } from '@core'
import { PingModule } from '@/ping'
import { AppService } from './app.service'

@Module({
  imports: [PingModule],
  controllers: [],
  providers: [AppService],
  exports: [AppService],
})
export class AppModule { }
