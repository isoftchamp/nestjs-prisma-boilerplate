import { Logger, Module } from '@nestjs/common';

import { CoreModule } from '@/core.module.js';
import { HealthModule } from '@/health/health.module.js';

import { AuthProcessor } from './processors/auth.processor.js';

@Module({
  imports: [CoreModule, HealthModule],
  controllers: [],
  providers: [AuthProcessor, Logger],
})
export class WorkerModule {}
