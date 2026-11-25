import { Inject, Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type ExtendedError } from 'socket.io';

import { type Configuration, configuration } from '@/config/configuration.js';
import { AuthService } from '@/domain/auth/auth.service.js';
import { LOGGER_CONTEXT } from '@/logging/logger.constants.js';
import { sanitizeLogUrl } from '@/logging/request-log-context.js';

import { Socket } from './websocket.types.js';

@Injectable()
export class SocketAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(configuration.KEY) private readonly config: Configuration,
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) {}

  async use(socket: Socket, next: (err?: ExtendedError) => void): Promise<void> {
    const token =
      typeof socket.handshake?.query?.token === 'string'
        ? socket.handshake?.query?.token
        : socket.handshake?.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new UnauthorizedException());
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.auth.user.secret,
      });
      const user = await this.authService.findUserByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException();
      }
      socket.user = user; // Attach user info for further usage
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Socket authentication failed';
      this.logger.error(
        {
          message,
          socket: this.getSocketLogMetadata(socket),
          error: err instanceof Error ? err : undefined,
        },
        err instanceof Error ? err.stack : undefined,
        LOGGER_CONTEXT.GATEWAYS,
      );
      next(new UnauthorizedException());
    }
  }

  private getSocketLogMetadata(socket: Socket) {
    const url = socket.handshake?.url;

    return {
      id: socket.id,
      namespace: socket.nsp?.name,
      path: sanitizeLogUrl(url),
      address: socket.handshake?.address,
      origin: socket.handshake?.headers?.origin,
      referer: socket.handshake?.headers?.referer,
      userAgent: socket.handshake?.headers?.['user-agent'],
      transport: socket.conn?.transport?.name,
    };
  }
}
