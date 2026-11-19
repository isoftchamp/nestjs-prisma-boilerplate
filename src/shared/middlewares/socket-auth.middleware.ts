import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { type ExtendedError } from 'socket.io';

import { AuthService } from '@/web/features/auth/auth.service.js';
import { ENV, LOGGER_CONTEXT } from '../enums/index.js';
import { sanitizeLogUrl } from '../helpers/index.js';
import { Socket } from '../interfaces/index.js';

@Injectable()
export class SocketAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
      const secret = this.configService.getOrThrow<string>(ENV.USER_SECRET);
      const payload = this.jwtService.verify(token, {
        secret,
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
