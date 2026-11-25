import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import 'reflect-metadata';
import 'winston-daily-rotate-file';

import { type Configuration, configuration } from '@/config/configuration.js';
import { LoggerType } from '@/config/environment.js';
import { type WinstonLoggerOptions, getWinstronLogger } from '@/logging/logger.factory.js';
import { RuntimeLifecycleService } from '@/redis/redis-resources.service.js';

import { WorkerModule } from './worker.module.js';

async function bootstrap() {
  const worker = await NestFactory.create(WorkerModule);
  worker.enableShutdownHooks();

  const config = worker.get<Configuration>(configuration.KEY);
  const { app, logging } = config;

  if (logging.type === LoggerType.Winston) {
    const maxFiles = logging.maxFiles;
    const datePattern = 'YYYY-MM-DD';
    const logLevel = logging.level;
    const dbUrl = logging.databaseUrl;
    const appEnv = app.environment;
    const loggerOptions: WinstonLoggerOptions = {
      maxFiles,
      datePattern,
      defaultContext: 'Worker',
      logLevel,
      dbUrl,
      dbCollectionSuffix: 'worker',
      appEnv,
      runtime: 'worker',
      podName: logging.podName,
      podNamespace: logging.podNamespace,
      nodeName: logging.nodeName,
    };

    const winstonLogger = getWinstronLogger(loggerOptions);
    worker.get(RuntimeLifecycleService).setLogger(winstonLogger);
    worker.useLogger(winstonLogger);
  }

  await worker.listen(app.workerPort);

  const logger = new Logger();
  logger.log(`Worker is running on: ${await worker.getUrl()}`);
}

bootstrap();
