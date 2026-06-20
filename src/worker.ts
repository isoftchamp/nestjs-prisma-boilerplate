import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import 'winston-daily-rotate-file';

import { ENV, LOGGER_TYPE } from './shared/enums';
import { type WinstonLoggerOptions, getWinstronLogger } from './shared/helpers';
import { WorkerModule } from './worker/worker.module';

async function bootstrap() {
  const worker = await NestFactory.create(WorkerModule);

  const configService = worker.get(ConfigService);

  if (configService.get<string>(ENV.LOGGER_TYPE) === LOGGER_TYPE.WINSTON) {
    const maxFiles = configService.get(ENV.LOGGER_MAX_FILES);
    const datePattern = 'YYYY-MM-DD';
    const logLevel = configService.get(ENV.LOGGER_LEVEL);
    const dbUrl = configService.get(ENV.LOGGER_DATABASE_URL);
    const appEnv = configService.get<string>(ENV.APP_ENV);
    const loggerOptions: WinstonLoggerOptions = {
      maxFiles,
      datePattern,
      defaultContext: 'Worker',
      logLevel,
      dbUrl,
      dbCollectionSuffix: 'worker',
      appEnv,
      runtime: 'worker',
      podName: configService.get<string>(ENV.LOGGER_POD_NAME),
      podNamespace: configService.get<string>(ENV.LOGGER_POD_NAMESPACE),
      nodeName: configService.get<string>(ENV.LOGGER_NODE_NAME),
    };

    worker.useLogger(getWinstronLogger(loggerOptions));
  }

  const port = configService.get(ENV.WORKER_PORT);
  await worker.listen(port);

  const logger = new Logger();
  logger.log(`Worker is running on: ${await worker.getUrl()}`);
}

bootstrap();
