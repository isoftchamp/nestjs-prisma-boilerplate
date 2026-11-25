import { type Environment } from './environment.js';

export const createLoggingConfig = (environment: Environment) => ({
  type: environment.LOGGER_TYPE,
  maxFiles: environment.LOGGER_MAX_FILES,
  level: environment.LOGGER_LEVEL,
  databaseUrl: environment.LOGGER_DATABASE_URL,
  podName: environment.LOGGER_POD_NAME,
  podNamespace: environment.LOGGER_POD_NAMESPACE,
  nodeName: environment.LOGGER_NODE_NAME,
});
