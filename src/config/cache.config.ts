import { type Environment } from './environment.js';

export const createCacheConfig = (environment: Environment) => ({
  mode: environment.CACHE_MODE,
  ttl: environment.CACHE_TTL,
});
