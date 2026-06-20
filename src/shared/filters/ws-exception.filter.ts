import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

import { APP_ENV, ENV, LOGGER_CONTEXT } from '../enums';
import { sanitizeLogUrl } from '../helpers';

@Catch()
export class WsExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    if (exception instanceof UnauthorizedException) {
      client.emit(
        'unauthorized',
        this.configService.get<string>(ENV.APP_ENV) === APP_ENV.DEV && {
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
