import { Module } from '@nestjs/common';

import { CoreModule } from '@/core/core.module.js';
import { SocketAuthMiddleware } from '@/shared/middlewares/index.js';
import { AuthModule } from '@/web/features/auth/auth.module.js';
import { WebsocketGateway } from './websocket.gateway.js';

@Module({
  imports: [CoreModule, AuthModule],
  providers: [WebsocketGateway, SocketAuthMiddleware],
})
export class WebsocketGatewayModule {}
