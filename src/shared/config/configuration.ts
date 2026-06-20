import * as os from 'os';
import * as path from 'path';

import { APP_ENV, ENV } from '@/shared/enums';

import { transformToBoolean, transformToInt } from '../helpers';

export const Configuration = () => ({
  [ENV.APP_NAME]: process.env.APP_NAME || 'nestjs-prisma-boilerplate',
  [ENV.APP_ENV]: process.env.APP_ENV || APP_ENV.DEV,
  [ENV.IS_PRD]: process.env.APP_ENV === APP_ENV.PRD,
  [ENV.IS_TEST]: process.env.APP_ENV === APP_ENV.TEST,
  [ENV.IS_STG]: process.env.APP_ENV === APP_ENV.STG,
  [ENV.IS_DEV]: process.env.APP_ENV === APP_ENV.DEV,
  [ENV.APP_PORT]: transformToInt(process.env.APP_PORT || '5000'),
  [ENV.WORKER_PORT]: transformToInt(process.env.WORKER_PORT || '5001'),

  [ENV.USER_SECRET]: process.env.USER_SECRET || 'USER_SECRET',
  [ENV.USER_TOKEN_EXPIRE_IN]: process.env.USER_TOKEN_EXPIRE_IN || '1d',
  [ENV.USER_REFRESH_SECRET]: process.env.USER_REFRESH_SECRET || 'USER_REFRESH_SECRET',
  [ENV.USER_REFRESH_TOKEN_EXPIRE_IN]: process.env.USER_REFRESH_TOKEN_EXPIRE_IN || '7d',

  [ENV.ADMIN_SECRET]: process.env.ADMIN_SECRET || 'ADMIN_SECRET',
  [ENV.ADMIN_REFRESH_SECRET]: process.env.ADMIN_REFRESH_SECRET || 'ADMIN_REFRESH_SECRET',
  [ENV.ADMIN_TOKEN_EXPIRE_IN]: process.env.ADMIN_TOKEN_EXPIRE_IN || '15m',
  [ENV.ADMIN_REFRESH_TOKEN_EXPIRE_IN]: process.env.ADMIN_REFRESH_TOKEN_EXPIRE_IN || '7d',

  [ENV.DATABASE_URL]: process.env.DATABASE_URL,

  [ENV.CACHE_MODE]: process.env.CACHE_MODE || 'redis',
  [ENV.CACHE_TTL]: transformToInt(process.env.CACHE_TTL || '3600'),

  [ENV.USE_QUEUE]: transformToBoolean(process.env.USE_QUEUE || 'true'),

  [ENV.REDIS_MODE]: process.env.REDIS_MODE || 'single',
  [ENV.REDIS_URL]: process.env.REDIS_URL || 'redis://127.0.0.1:6379',

  [ENV.LOGGER_TYPE]: process.env.LOGGER_TYPE || 'winston',
  [ENV.LOGGER_MAX_FILES]: process.env.LOGGER_MAX_FILES || '30d',
  [ENV.LOGGER_LEVEL]: process.env.LOGGER_LEVEL || 'warn',
  [ENV.LOGGER_DATABASE_URL]: process.env.LOGGER_DATABASE_URL,
  [ENV.LOGGER_POD_NAME]: process.env.LOGGER_POD_NAME,
  [ENV.LOGGER_POD_NAMESPACE]: process.env.LOGGER_POD_NAMESPACE,
  [ENV.LOGGER_NODE_NAME]: process.env.LOGGER_NODE_NAME,

  [ENV.UPLOAD_PATH]: path.join(os.tmpdir(), process.env.UPLOAD_FOLDER || 'upload'),
  [ENV.BODY_SIZE]: process.env.BODY_SIZE || '10mb',

  [ENV.SWAGGER_TITLE]: process.env.SWAGGER_TITLE || 'Nest.js boilerplate',
  [ENV.SWAGGER_DESCRIPTION]: process.env.SWAGGER_DESCRIPTION || 'Nest.js boilerplate',
  [ENV.SWAGGER_VERSION]: process.env.SWAGGER_VERSION || '1.0',
  [ENV.SWAGGER_FAVICON]: process.env.SWAGGER_FAVICON || '/assets/favicon.ico',
  [ENV.SWAGGER_ENDPOINT]: process.env.SWAGGER_ENDPOINT || '/api-docs',
});
