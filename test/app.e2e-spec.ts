import { type INestApplication } from '@nestjs/common';
import { HealthIndicatorService, PrismaHealthIndicator, TerminusModule } from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';

import { PrismaService } from '@/data-access/prisma.service.js';
import { CacheHealthIndicator } from '@/health/cache.health-indicator.js';
import { HealthController } from '@/health/health.controller.js';

vi.setConfig({ testTimeout: 30000 });

describe('Application (e2e)', () => {
  let app: INestApplication;
  let databaseUp = true;
  let cacheUp = true;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: {} },
        {
          provide: PrismaHealthIndicator,
          inject: [HealthIndicatorService],
          useFactory: (indicator: HealthIndicatorService) => ({
            pingCheck: () =>
              indicator.check('database').attempt(async () => {
                if (!databaseUp) {
                  throw new Error('Database unavailable');
                }
              }),
          }),
        },
        {
          provide: CacheHealthIndicator,
          inject: [HealthIndicatorService],
          useFactory: (indicator: HealthIndicatorService) => ({
            check: () =>
              indicator.check('cache').attempt(async () => {
                if (!cacheUp) {
                  throw new Error('Cache unavailable');
                }
              }),
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    databaseUp = true;
    cacheUp = true;
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns readiness when dependencies are available', async () => {
    await request(app.getHttpServer()).get('/healthcheck').expect(200);
  });

  it('returns 503 when the database is unavailable', async () => {
    databaseUp = false;
    await request(app.getHttpServer()).get('/healthcheck').expect(503);
  });

  it('returns 503 when the cache is unavailable', async () => {
    cacheUp = false;
    await request(app.getHttpServer()).get('/healthcheck').expect(503);
  });

  it('keeps process-only liveness available', async () => {
    databaseUp = false;
    cacheUp = false;
    await request(app.getHttpServer()).get('/healthcheck/live').expect(200, { status: 'ok' });
  });
});
