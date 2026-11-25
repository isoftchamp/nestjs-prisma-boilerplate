import { type Environment } from './environment.js';

export const createAuthConfig = (environment: Environment) => ({
  user: {
    secret: environment.USER_SECRET,
    tokenExpiresIn: environment.USER_TOKEN_EXPIRE_IN,
    refreshSecret: environment.USER_REFRESH_SECRET,
    refreshTokenExpiresIn: environment.USER_REFRESH_TOKEN_EXPIRE_IN,
  },
  admin: {
    secret: environment.ADMIN_SECRET,
    tokenExpiresIn: environment.ADMIN_TOKEN_EXPIRE_IN,
    refreshSecret: environment.ADMIN_REFRESH_SECRET,
    refreshTokenExpiresIn: environment.ADMIN_REFRESH_TOKEN_EXPIRE_IN,
  },
});
