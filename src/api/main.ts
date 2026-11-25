import { ForbiddenException, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { type Request, type Response, json, urlencoded } from 'express';
import 'reflect-metadata';
import 'winston-daily-rotate-file';

import { type Configuration, configuration } from '@/config/configuration.js';
import { LoggerType } from '@/config/environment.js';
import { type WinstonLoggerOptions, getWinstronLogger } from '@/logging/logger.factory.js';
import { RuntimeLifecycleService } from '@/redis/redis-resources.service.js';

import { ApiModule } from './api.module.js';
import { AllExceptionFilter } from './filters/http-exception.filter.js';
import { setupSwagger } from './swagger.js';

const rawBodyBuffer = (req: Request, _res: Response, buffer: Buffer, _encoding: string) => {
  if (!req.headers['stripe-signature']) {
    return;
  }

  if (buffer && buffer.length) {
    (req as Request & { rawBody?: Buffer }).rawBody = buffer;
  }
};

async function bootstrap() {
  const web = await NestFactory.create(ApiModule, {
    rawBody: true,
  });
  web.enableShutdownHooks();

  const config = web.get<Configuration>(configuration.KEY);
  const { app, logging } = config;
  const logger = web.get(Logger);

  if (logging.type === LoggerType.Winston) {
    const maxFiles = logging.maxFiles;
    const datePattern = 'YYYY-MM-DD';
    const logLevel = logging.level;
    const dbUrl = logging.databaseUrl;
    const appEnv = app.environment;
    const loggerOptions: WinstonLoggerOptions = {
      maxFiles,
      datePattern,
      defaultContext: 'App',
      logLevel,
      dbUrl,
      dbCollectionSuffix: 'web',
      appEnv,
      runtime: 'web',
      podName: logging.podName,
      podNamespace: logging.podNamespace,
      nodeName: logging.nodeName,
    };

    const winstonLogger = getWinstronLogger(loggerOptions);
    web.get(RuntimeLifecycleService).setLogger(winstonLogger);
    web.useLogger(winstonLogger);
  }

  web.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Configure body parser with size limit from environment
  const bodySize = app.bodySize;
  web.use(
    json({
      verify: rawBodyBuffer,
      limit: bodySize,
      type: ['application/json', 'application/webhook+json'],
    }),
  );
  web.use(urlencoded({ verify: rawBodyBuffer, limit: bodySize, extended: true }));
  web.use(cookieParser());

  web.useGlobalFilters(new AllExceptionFilter(app, logger));

  setupSwagger(web);

  web.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, origin?: boolean | string) => void,
    ) => {
      if (!origin || app.allowedCors.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new ForbiddenException(`Not allowed by CORS (${origin})`));
      }
    },
    credentials: true,
  });

  await web.listen(app.apiPort);

  logger.log(`Application is running on: ${await web.getUrl()}`);
}

bootstrap();
