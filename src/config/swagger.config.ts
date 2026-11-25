import { type Environment } from './environment.js';

export const createSwaggerConfig = (environment: Environment) => ({
  title: environment.SWAGGER_TITLE,
  description: environment.SWAGGER_DESCRIPTION,
  version: environment.SWAGGER_VERSION,
  favicon: environment.SWAGGER_FAVICON,
  endpoint: environment.SWAGGER_ENDPOINT,
  basicAuth: {
    username: environment.SWAGGER_BASIC_AUTH_USER,
    password: environment.SWAGGER_BASIC_AUTH_PASSWORD,
  },
});
