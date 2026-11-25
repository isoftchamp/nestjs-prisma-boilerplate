import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Inject,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Socket } from 'socket.io';

import { type Configuration, configuration } from '@/config/configuration.js';
import { LOGGER_CONTEXT } from '@/logging/logger.constants.js';
import { sanitizeLogUrl } from '@/logging/request-log-context.js';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(configuration.KEY) private readonly config: Configuration,
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    if (exception instanceof UnauthorizedException) {
      client.emit(
        'unauthorized',
        this.config.app.isDevelopment && {
          message: exception,
        },
      );
      client.disconnect();
    }

    const trace = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      {
        message: exception instanceof Error ? exception.message : 'WebSocket exception',
        socket: this.getSocketLogMetadata(client),
        error: exception instanceof Error ? exception : undefined,
      },
      trace,
      LOGGER_CONTEXT.GATEWAYS,
    );
  }

  private getSocketLogMetadata(socket: Socket) {
    return {
      id: socket.id,
      namespace: socket.nsp?.name,
      path: sanitizeLogUrl(socket.handshake?.url),
      address: socket.handshake?.address,
      origin: socket.handshake?.headers?.origin,
      referer: socket.handshake?.headers?.referer,
      userAgent: socket.handshake?.headers?.['user-agent'],
      transport: socket.conn?.transport?.name,
    };
  }
}
