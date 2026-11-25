import { type ConfigType, registerAs } from '@nestjs/config';

import { createAppConfig } from './app.config.js';
import { createAuthConfig } from './auth.config.js';
import { createCacheConfig } from './cache.config.js';
import { createDatabaseConfig } from './database.config.js';
import { parseEnvironment } from './environment.js';
import { createLoggingConfig } from './logging.config.js';
import { createQueueConfig } from './queue.config.js';
import { createRedisConfig } from './redis.config.js';
import { createSwaggerConfig } from './swagger.config.js';

export const configuration = registerAs('configuration', () => {
  const environment = parseEnvironment();

  return {
    app: createAppConfig(environment),
    auth: createAuthConfig(environment),
    cache: createCacheConfig(environment),
    database: createDatabaseConfig(environment),
    logging: createLoggingConfig(environment),
    queue: createQueueConfig(environment),
    redis: createRedisConfig(environment),
    swagger: createSwaggerConfig(environment),
  };
});

export type Configuration = ConfigType<typeof configuration>;
