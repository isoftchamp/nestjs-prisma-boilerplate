import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module.js';
import { HealthcheckModule } from '../core/healthcheck/healthcheck.module.js';
import { RequestLoggerMiddleware } from '../shared/middlewares/index.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule, CoreModule, HealthcheckModule],
  controllers: [],
  providers: [Logger],
})
export class WorkerModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
