import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { DatabaseModule } from '@/data-access/database.module.js';

import { CacheHealthIndicator } from './cache.health-indicator.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [DatabaseModule, TerminusModule],
  controllers: [HealthController],
  providers: [CacheHealthIndicator],
})
export class HealthModule {}
