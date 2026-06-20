import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { InternalUrl, LOGGER_CONTEXT } from '../enums';
import {
  createRequestLogContext,
  getLogUserId,
  runWithRequestLogContext,
  sanitizeLogUrl,
} from '../helpers';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const requestContext = createRequestLogContext(req);
    const common = {
      requestId: requestContext.requestId,
      request: requestContext.request,
      userId: getLogUserId(req.user),
      host: req.ip,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
    };

    res.on('error', (err) => {
      this.logger.error(
        {
          message: `[${req.method}] ${sanitizeLogUrl(req.originalUrl || req.url)} - ${err.name}`,
          ...common,
        },
        err,
        LOGGER_CONTEXT.WEB,
      );
    });

    res.on('finish', () => {
      const statusCode: number = res.statusCode;
      if (statusCode >= 400) {
        if (res.locals.exceptionLogged) {
          return;
        }

        this.logger.error(
          {
            message: `[${req.method}] ${sanitizeLogUrl(req.originalUrl || req.url)} - ${statusCode}`,
            ...common,
          },
          '',
          LOGGER_CONTEXT.WEB,
        );
      } else {
        if (req.url !== InternalUrl.HEALTH_CHECK) {
          this.logger.log(
            {
              message: `[${req.method}] ${sanitizeLogUrl(req.originalUrl || req.url)} - ${statusCode}`,
              ...common,
            },
            LOGGER_CONTEXT.WEB,
          );
        }
      }
    });

    runWithRequestLogContext(requestContext, next);
  }
}
