import { Module } from '@nestjs/common';

import { CoreModule } from '@/core.module.js';
import { AuthModule } from '@/domain/auth/auth.module.js';

import { SocketAuthMiddleware } from './socket-auth.middleware.js';
import { WebsocketGateway } from './websocket.gateway.js';

@Module({
  imports: [CoreModule, AuthModule],
  providers: [WebsocketGateway, SocketAuthMiddleware],
})
export class WebsocketModule {}
