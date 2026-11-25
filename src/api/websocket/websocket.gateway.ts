import { Inject, Logger, OnApplicationShutdown, OnModuleInit, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, createCluster } from 'redis';
import { Server, Socket } from 'socket.io';

import { type Configuration, configuration } from '@/config/configuration.js';
import { RedisMode } from '@/config/environment.js';
import { LOGGER_CONTEXT } from '@/logging/logger.constants.js';

import { SocketAuthMiddleware } from './socket-auth.middleware.js';
import { WEBSOCKET_CORS_ORIGINS, WEBSOCKET_TRANSPORTS } from './websocket.constants.js';
import { WsExceptionFilter } from './ws-exception.filter.js';

@WebSocketGateway({
  transports: WEBSOCKET_TRANSPORTS,
  cors: {
    origin: WEBSOCKET_CORS_ORIGINS,
  },
})
@UseFilters(WsExceptionFilter)
export class WebsocketGateway
  implements
    OnModuleInit,
    OnApplicationShutdown,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  private redisPubClient!: ReturnType<typeof createClient> | ReturnType<typeof createCluster>;
  private redisSubClient!: ReturnType<typeof createClient> | ReturnType<typeof createCluster>;

  private socketClients: Set<Socket> = new Set();

  @WebSocketServer() server!: Server;

  constructor(
    @Inject(configuration.KEY) private readonly config: Configuration,
    private readonly socketAuthMiddleware: SocketAuthMiddleware,
  ) {}

  afterInit(_server: Server) {}

  async onModuleInit() {
    try {
      // Create Redis clients for pub/sub
      const { mode: redisMode, url: redisUrl } = this.config.redis;
      if (redisMode === RedisMode.Single) {
        this.redisPubClient = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
          },
        });
      } else {
        this.redisPubClient = createCluster({
          rootNodes: [{ url: redisUrl }],
          useReplicas: true,
          defaults: {
            socket: {
              reconnectStrategy: (retries) => Math.min(retries * 100, 5000),
            },
          },
        });
      }
      this.redisSubClient = this.redisPubClient.duplicate();

      this.redisPubClient.on('error', (err) =>
        this.logger.error('Redis Pub Client Error', err, LOGGER_CONTEXT.GATEWAYS),
      );
      this.redisSubClient.on('error', (err) =>
        this.logger.error('Redis Sub Client Error', err, LOGGER_CONTEXT.GATEWAYS),
      );

      await Promise.all([this.redisPubClient.connect(), this.redisSubClient.connect()]);

      // Attach the Redis adapter to the server
      if (this.redisPubClient && this.redisSubClient) {
        this.server.adapter(createAdapter(this.redisPubClient, this.redisSubClient));
        this.logger.log('Redis adapter attached to server', LOGGER_CONTEXT.GATEWAYS);
      } else {
        this.logger.error('Redis adapter not attached to server', LOGGER_CONTEXT.GATEWAYS);
      }
    } catch (error) {
      this.logger.error('Redis connection failed', error, LOGGER_CONTEXT.GATEWAYS);
      throw error;
    }

    this.server.use((socket, next) => this.socketAuthMiddleware.use(socket, next));
    this.logger.log(`${WebsocketGateway.name}: Initialized`, LOGGER_CONTEXT.GATEWAYS);
  }

  async onApplicationShutdown() {
    await Promise.all([
      this.closeRedisClient(this.redisSubClient),
      this.closeRedisClient(this.redisPubClient),
    ]);
  }

  handleConnection(client: Socket) {
    this.socketClients.add(client);
    this.logger.log(
      `${WebsocketGateway.name}: Client connected ${client.id}`,
      LOGGER_CONTEXT.GATEWAYS,
    );
  }

  handleDisconnect(client: Socket) {
    this.socketClients.delete(client);
    this.logger.log(
      `${WebsocketGateway.name}: Client disconnected ${client.id}`,
      LOGGER_CONTEXT.GATEWAYS,
    );
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: unknown) {
    this.logger.log(
      `${WebsocketGateway.name}: ping from client id: ${client.id}, Payload: ${data}`,
    );

    return {
      event: 'pong',
      data,
    };
  }

  private async closeRedisClient(
    client?: ReturnType<typeof createClient> | ReturnType<typeof createCluster>,
  ) {
    if (!client?.isOpen) {
      return;
    }

    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
  }
}
