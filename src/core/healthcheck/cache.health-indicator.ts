import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import type { Cache } from 'cache-manager';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CacheHealthIndicator {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly healthIndicator: HealthIndicatorService,
  ) {}

  check() {
    return this.healthIndicator
      .check('cache')
      .attempt(async () => {
        const key = `healthcheck:${randomUUID()}`;
        const value = randomUUID();

        try {
          await this.cache.set(key, value, 5_000);
          if ((await this.cache.get<string>(key)) !== value) {
            throw new Error('Cache read-back mismatch');
          }
        } finally {
          await this.cache.del(key).catch(() => false);
        }
      })
      .withTimeout(2_000);
  }
}
