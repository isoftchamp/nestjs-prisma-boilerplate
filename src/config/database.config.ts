import { type Environment } from './environment.js';

export const createDatabaseConfig = (environment: Environment) => ({
  url: environment.DATABASE_URL,
});
