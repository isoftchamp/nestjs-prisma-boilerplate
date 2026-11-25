import { type Environment } from './environment.js';

export const createRedisConfig = (environment: Environment) => ({
  mode: environment.REDIS_MODE,
  url: environment.REDIS_URL,
});
