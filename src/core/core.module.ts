import KeyvRedis, { createCluster } from '@keyv/redis';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Cluster as IORedisCluster } from 'ioredis';
import Keyv from 'keyv';

import { Configuration } from '../shared/config/index.js';
import { CACHE_TYPE, ENV, FLOW, QUEUE, REDIS_MODE } from '../shared/enums/index.js';
import { DatabaseModule } from './database/database.module.js';
import { QueueModule } from './queue/queue.module.js';
import { UploadModule } from './upload/upload.module.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [Configuration] }),
    DatabaseModule,
    UploadModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const cacheMode = configService.get(ENV.CACHE_MODE);
        const prefix = `{\`${configService.get(ENV.APP_NAME)}\`}:${configService.get(ENV.APP_ENV)}`;
        const redisMode = configService.get(ENV.REDIS_MODE);
        const url = configService.get(ENV.REDIS_URL);
        const ttl = +configService.get(ENV.CACHE_TTL);

        if (cacheMode !== CACHE_TYPE.REDIS) {
          return { ttl };
        }

        const redisAdapter =
          redisMode === REDIS_MODE.SINGLE
            ? new KeyvRedis(url, { namespace: prefix })
            : (() => {
                const discoveryUrl = new URL(url);
                const cluster = createCluster({
                  rootNodes: [{ url }],
                  useReplicas: true,
                  defaults: {
                    username: discoveryUrl.username
                      ? decodeURIComponent(discoveryUrl.username)
                      : undefined,
                    password: discoveryUrl.password
                      ? decodeURIComponent(discoveryUrl.password)
                      : undefined,
                    socket: discoveryUrl.protocol === 'rediss:' ? { tls: true } : undefined,
                  },
                });
                cluster.on('error', (error) => Logger.error(error, undefined, 'RedisCluster'));
                return new KeyvRedis(cluster, { namespace: prefix });
              })();
        const store = new Keyv({ store: redisAdapter, ttl });
        store.on('error', (error) => Logger.error(error, undefined, 'Cache'));

        return { stores: [store], ttl };
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const prefix = `{${configService.get(ENV.APP_NAME)}}:${configService.get(ENV.APP_ENV)}`;
        const redisMode = configService.get(ENV.REDIS_MODE);
        const url = configService.get(ENV.REDIS_URL);
        const connection =
          redisMode === REDIS_MODE.CLUSTER
            ? (() => {
                const discoveryUrl = new URL(url);
                const cluster = new IORedisCluster(
                  [{ host: discoveryUrl.hostname, port: +(discoveryUrl.port || 6379) }],
                  {
                    redisOptions: {
                      username: discoveryUrl.username
                        ? decodeURIComponent(discoveryUrl.username)
                        : undefined,
                      password: discoveryUrl.password
                        ? decodeURIComponent(discoveryUrl.password)
                        : undefined,
                      tls: discoveryUrl.protocol === 'rediss:' ? {} : undefined,
                      maxRetriesPerRequest: null,
                    },
                  },
                );
                cluster.on('error', (error) => Logger.error(error, undefined, 'BullRedisCluster'));
                return cluster;
              })()
            : { url };

        return {
          connection,
          defaultJobOptions: {
            removeOnComplete: {
              age: 3600,
              count: 100,
            },
            removeOnFail: {
              age: 3600,
              count: 100,
            },
            attempts: 3,
          },
          prefix,
        };
      },
    }),
    QueueModule.register({
      queues: Object.values(QUEUE),
      flows: Object.values(FLOW),
    }),
  ],

  providers: [Logger, ConfigService],
  exports: [ConfigService, DatabaseModule, UploadModule, QueueModule, Logger, CacheModule],
})
export class CoreModule {}
