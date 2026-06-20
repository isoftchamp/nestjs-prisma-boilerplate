import { ForbiddenException, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import 'reflect-metadata';
import 'winston-daily-rotate-file';

import { ENV, LOGGER_TYPE } from './shared/enums';
import { AllExceptionFilter } from './shared/filters';
import { type WinstonLoggerOptions, getWinstronLogger } from './shared/helpers';
import { setupSwagger } from './swagger';
import { WebModule } from './web/web.module';

const rawBodyBuffer = (req, _res, buffer, _encoding) => {
  if (!req.headers['stripe-signature']) {
    return;
  }

  if (buffer && buffer.length) {
    req.rawBody = buffer;
  }
};

async function bootstrap() {
  const web = await NestFactory.create(WebModule, {
    rawBody: true,
  });

  const configService = web.get(ConfigService);
  const logger = web.get(Logger);

  if (configService.get<string>(ENV.LOGGER_TYPE) === LOGGER_TYPE.WINSTON) {
    const maxFiles = configService.get(ENV.LOGGER_MAX_FILES);
    const datePattern = 'YYYY-MM-DD';
    const logLevel = configService.get(ENV.LOGGER_LEVEL);
    const dbUrl = configService.get(ENV.LOGGER_DATABASE_URL);
    const appEnv = configService.get<string>(ENV.APP_ENV);
    const loggerOptions: WinstonLoggerOptions = {
      maxFiles,
      datePattern,
      defaultContext: 'App',
      logLevel,
      dbUrl,
      dbCollectionSuffix: 'web',
      appEnv,
      runtime: 'web',
      podName: configService.get<string>(ENV.LOGGER_POD_NAME),
      podNamespace: configService.get<string>(ENV.LOGGER_POD_NAMESPACE),
      nodeName: configService.get<string>(ENV.LOGGER_NODE_NAME),
    };

    web.useLogger(getWinstronLogger(loggerOptions));
  }

  web.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Configure body parser with size limit from environment
  const bodySize = configService.get(ENV.BODY_SIZE);
  web.use(
    json({
      verify: rawBodyBuffer,
      limit: bodySize,
      type: ['application/json', 'application/webhook+json'],
    }),
  );
  web.use(urlencoded({ verify: rawBodyBuffer, limit: bodySize, extended: true }));
  web.use(cookieParser());

  web.useGlobalFilters(new AllExceptionFilter(configService, logger));

  setupSwagger(web);

  web.enableCors({
    origin: (origin, callback) => {
      const allowedCors = (configService.get(ENV.ALLOWED_CORS) || '').split(',');

      if (!origin || allowedCors.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new ForbiddenException(`Not allowed by CORS (${origin})`));
      }
    },
    credentials: true,
  });

  const port = configService.get(ENV.APP_PORT);
  await web.listen(port);

  logger.log(`Application is running on: ${await web.getUrl()}`);
}

bootstrap();
