import { z } from 'zod';

export enum AppEnvironment {
  Development = 'dev',
  Staging = 'stg',
  Production = 'prd',
  Test = 'test',
}

export enum CacheMode {
  Memory = 'memory',
  Redis = 'redis',
}

export enum RedisMode {
  Cluster = 'cluster',
  Single = 'single',
}

export enum LoggerType {
  Nest = 'nest',
  Winston = 'winston',
}

const environmentSchema = z.object({
  APP_NAME: z.string().min(1).default('nestjs-prisma-boilerplate'),
  APP_ENV: z.enum(AppEnvironment).default(AppEnvironment.Development),
  APP_PORT: z.coerce.number().int().positive().default(5000),
  WORKER_PORT: z.coerce.number().int().positive().default(5001),
  ALLOWED_CORS: z.string().optional(),
  BODY_SIZE: z.string().min(1).default('10mb'),
  UPLOAD_FOLDER: z.string().min(1).default('upload'),

  USER_SECRET: z.string().min(1).default('USER_SECRET'),
  USER_TOKEN_EXPIRE_IN: z.string().min(1).default('1d'),
  USER_REFRESH_SECRET: z.string().min(1).default('USER_REFRESH_SECRET'),
  USER_REFRESH_TOKEN_EXPIRE_IN: z.string().min(1).default('7d'),
  ADMIN_SECRET: z.string().min(1).default('ADMIN_SECRET'),
  ADMIN_TOKEN_EXPIRE_IN: z.string().min(1).default('15m'),
  ADMIN_REFRESH_SECRET: z.string().min(1).default('ADMIN_REFRESH_SECRET'),
  ADMIN_REFRESH_TOKEN_EXPIRE_IN: z.string().min(1).default('7d'),

  DATABASE_URL: z.string().optional(),

  CACHE_MODE: z.enum(CacheMode).default(CacheMode.Redis),
  CACHE_TTL: z.coerce.number().int().nonnegative().default(3600000),
  USE_QUEUE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  REDIS_MODE: z.enum(RedisMode).default(RedisMode.Single),
  REDIS_URL: z.string().min(1).default('redis://127.0.0.1:6379'),

  LOGGER_TYPE: z.enum(LoggerType).default(LoggerType.Winston),
  LOGGER_MAX_FILES: z.string().min(1).default('30d'),
  LOGGER_LEVEL: z.string().min(1).default('warn'),
  LOGGER_DATABASE_URL: z.string().optional(),
  LOGGER_POD_NAME: z.string().optional(),
  LOGGER_POD_NAMESPACE: z.string().optional(),
  LOGGER_NODE_NAME: z.string().optional(),

  SWAGGER_TITLE: z.string().min(1).default('Nest.js boilerplate'),
  SWAGGER_DESCRIPTION: z.string().min(1).default('Nest.js boilerplate'),
  SWAGGER_VERSION: z.string().min(1).default('1.0'),
  SWAGGER_FAVICON: z.string().min(1).default('/assets/favicon.ico'),
  SWAGGER_ENDPOINT: z.string().min(1).default('/api-docs'),
  SWAGGER_BASIC_AUTH_USER: z.string().optional(),
  SWAGGER_BASIC_AUTH_PASSWORD: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export const parseEnvironment = (): Environment => environmentSchema.parse(process.env);
