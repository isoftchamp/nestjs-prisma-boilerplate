import { type Environment } from './environment.js';

export const createQueueConfig = (environment: Environment) => ({
  enabled: environment.USE_QUEUE,
});
