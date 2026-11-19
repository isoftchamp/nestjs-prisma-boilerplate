import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { DatabaseModule } from '../database/database.module.js';
import { CacheHealthIndicator } from './cache.health-indicator.js';
import { HealthcheckController } from './healthcheck.controller.js';

@Module({
  imports: [DatabaseModule, TerminusModule],
  controllers: [HealthcheckController],
  providers: [CacheHealthIndicator],
})
export class HealthcheckModule {}
