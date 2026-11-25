import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';

import { CoreModule } from '@/core.module.js';
import { AuthModule } from '@/domain/auth/auth.module.js';
import { HealthModule } from '@/health/health.module.js';

import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { WebsocketModule } from './websocket/websocket.module.js';

@Module({
  imports: [
    CoreModule,
    HealthModule,
    AuthModule,
    WebsocketModule,
    ServeStaticModule.forRoot({
      rootPath: resolve('public'),
      serveRoot: '/',
    }),
  ],
  controllers: [],
  providers: [Logger],
})
export class ApiModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
