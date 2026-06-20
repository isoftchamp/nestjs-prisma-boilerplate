import chalk from 'chalk';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';
import { MongoDB } from 'winston-mongodb';
import type * as Transport from 'winston-transport';

import { APP_ENV } from '../enums';
import { getCurrentRequestLogContext } from './request-log-context';

const SPLAT = Symbol.for('splat');
const RESERVED_LOG_METADATA_KEYS = new Set([
  'level',
  'message',
  'timestamp',
  'context',
  'stack',
  'error',
  'name',
  'cause',
]);

type LogMetadata = Record<string | symbol, unknown>;

export type WinstonLoggerOptions = {
  maxFiles: string | number;
  datePattern: string;
  defaultContext: string;
  logLevel?: string;
  dbUrl?: string;
  dbCollectionSuffix?: string;
  appEnv?: APP_ENV | string;
  runtime?: string;
  podName?: string;
  podNamespace?: string;
  nodeName?: string;
};

export function getWinstronLogger(options: WinstonLoggerOptions) {
  const {
    maxFiles,
    datePattern,
    defaultContext,
    logLevel,
    dbUrl,
    dbCollectionSuffix,
    ...metadata
  } = options;
  const transportsArr: Transport[] = [
    new transports.DailyRotateFile({
      filename: `logs/%DATE%-${dbCollectionSuffix}-error.log`,
      level: 'error',
      format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json()),
      datePattern,
      zippedArchive: false,
      maxFiles,
    }),
    new transports.DailyRotateFile({
      level: logLevel,
      filename: `logs/%DATE%-${dbCollectionSuffix}-combined.log`,
      format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json()),
      datePattern,
      zippedArchive: false,
      maxFiles,
    }),
    new transports.Console({
      format: createConsoleFormat(defaultContext, metadata),
    }),
  ];

  if (dbUrl?.length) {
    transportsArr.push(
      new MongoDB({
        level: logLevel,
        db: dbUrl,
        collection: `logs_combined_${dbCollectionSuffix}`,
        format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json()),
      }),
      new MongoDB({
        level: 'error',
        db: dbUrl,
        collection: `logs_error_${dbCollectionSuffix}`,
        format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.json()),
      }),
    );
  }

  return WinstonModule.createLogger({
    transports: transportsArr,
  });
}

function createConsoleFormat(defaultContext: string, metadata: LogMetadata) {
  const isStructuredConsole = metadata.appEnv === APP_ENV.STG || metadata.appEnv === APP_ENV.PRD;

  if (isStructuredConsole) {
    return format.combine(
      format.errors({ stack: true }),
      format.timestamp(),
      format.printf((info) =>
        JSON.stringify(
          compactObject({ ...toStructuredConsoleLog(info, defaultContext), ...metadata }),
        ),
      ),
    );
  }

  return format.combine(
    format.errors({ stack: true }),
    format.colorize({ all: true }),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf((info) => {
      return `${chalk.green(`[Nest] ${process.pid}`)}\t${info.timestamp}\t${info.level} [${chalk.yellow(String(info.context || defaultContext))}] ${toMessage(info.message)}${info.level.match('error') && info.stack ? '\n' + info.stack : ''}`;
    }),
  );
}

function toStructuredConsoleLog(info: LogMetadata, defaultContext: string): LogMetadata {
  const { message, metadata } = extractMessageMetadata(info.message);
  const infoMetadata = extractInfoMetadata(info);
  const requestContext = getCurrentRequestLogContext() ?? {};
  const error = extractError(info);
  const context = info.context || metadata.context || defaultContext;

  return compactObject({
    timestamp: info.timestamp,
    level: info.level,
    message,
    ...requestContext,
    ...infoMetadata,
    ...metadata,
    context,
    ...(error ? { error } : {}),
  });
}

function extractInfoMetadata(info: LogMetadata): LogMetadata {
  return Object.entries(info).reduce<LogMetadata>((metadata, [key, value]) => {
    if (!RESERVED_LOG_METADATA_KEYS.has(key)) {
      metadata[key] = value;
    }

    return metadata;
  }, {});
}

function extractMessageMetadata(message: unknown): { message: string; metadata: LogMetadata } {
  if (message instanceof Error) {
    return {
      message: message.message,
      metadata: { error: serializeError(message) },
    };
  }

  if (isLogMetadata(message)) {
    const { message: nestedMessage, ...metadata } = message;

    return {
      message: toMessage(nestedMessage),
      metadata,
    };
  }

  return {
    message: toMessage(message),
    metadata: {},
  };
}

function extractError(info: LogMetadata): LogMetadata | undefined {
  if (info instanceof Error) {
    return serializeError(info);
  }

  if (info.error instanceof Error) {
    return mergeErrorWithStack(serializeError(info.error), extractStack(info));
  }

  const splat = info[SPLAT] as unknown[] | undefined;
  const errorFromSplat = splat?.find((item): item is Error => item instanceof Error);
  if (errorFromSplat) {
    return mergeErrorWithStack(serializeError(errorFromSplat), extractStack(info));
  }

  const errorFromStack = extractStackError(info);
  if (errorFromStack) {
    return serializeError(errorFromStack);
  }

  const stack = extractStack(info);
  if (stack) {
    return compactObject({
      name: info.name,
      message: typeof info.message === 'string' ? info.message : undefined,
      stack,
      cause: info.cause instanceof Error ? serializeError(info.cause) : info.cause,
    });
  }

  return undefined;
}

function extractStack(info: LogMetadata): string | undefined {
  if (typeof info.stack === 'string' && info.stack.length) {
    return info.stack;
  }

  if (Array.isArray(info.stack)) {
    return info.stack.find((item): item is string => typeof item === 'string' && item.length > 0);
  }

  return undefined;
}

function extractStackError(info: LogMetadata): Error | undefined {
  if (!Array.isArray(info.stack)) {
    return undefined;
  }

  return info.stack.find((item): item is Error => item instanceof Error);
}

function mergeErrorWithStack(error: LogMetadata, stack: string | undefined): LogMetadata {
  if (!stack || typeof error.stack === 'string') {
    return error;
  }

  return compactObject({ ...error, stack });
}

function serializeError(error: Error): LogMetadata {
  const errorWithCause = error as Error & { cause?: unknown };

  return compactObject({
    name: error.name,
    message: error.message,
    stack: error.stack,
    cause:
      errorWithCause.cause instanceof Error
        ? serializeError(errorWithCause.cause)
        : errorWithCause.cause,
  });
}

function isLogMetadata(value: unknown): value is LogMetadata {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }

  if (message === undefined || message === null) {
    return '';
  }

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

function compactObject<T extends LogMetadata>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}
