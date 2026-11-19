import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';

import { WebModule } from '../src/web/web.module.js';

vi.setConfig({ testTimeout: 30000 });

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WebModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close(); // Ensure application is closed after all tests
  });

  it('/healthcheck (GET)', () => {
    const res = request(app.getHttpServer()).get('/healthcheck');

    return res.expect(200);
  });
});
