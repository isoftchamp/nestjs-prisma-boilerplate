import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import { InternalUrl } from '../../shared/enums/index.js';
import { PrismaService } from '../database/prisma.service.js';
import { CacheHealthIndicator } from './cache.health-indicator.js';

@Controller(InternalUrl.HEALTH_CHECK)
@ApiTags('Public')
export class HealthcheckController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly cache: CacheHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  readiness() {
    return this.health.check([
      async () => this.prisma.pingCheck('database', this.prismaService).withTimeout(2_000),
      async () => this.cache.check(),
    ]);
  }

  @Get('live')
  liveness() {
    return {
      status: 'ok',
    };
  }
}
