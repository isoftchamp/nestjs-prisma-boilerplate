import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';

import { PrismaService } from '@/data-access/prisma.service.js';

import { CacheHealthIndicator } from './cache.health-indicator.js';
import { InternalUrl } from './health.constants.js';

@Controller(InternalUrl.HEALTH_CHECK)
@ApiTags('Public')
export class HealthController {
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
