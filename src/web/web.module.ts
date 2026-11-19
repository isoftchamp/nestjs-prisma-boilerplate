import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';

import { CoreModule } from '@/core/core.module.js';
import { HealthcheckModule } from '@/core/healthcheck/healthcheck.module.js';
import { WebsocketGatewayModule } from '@/gateways/websocket.gateway.module.js';
import { RequestLoggerMiddleware } from '@/shared/middlewares/index.js';
import { FeaturesModule } from './features/features.module.js';

@Module({
  imports: [
    CoreModule,
    HealthcheckModule,
    FeaturesModule,
    WebsocketGatewayModule,
    ServeStaticModule.forRoot({
      rootPath: resolve('public'),
      serveRoot: '/',
    }),
  ],
  controllers: [],
  providers: [Logger],
})
export class WebModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
