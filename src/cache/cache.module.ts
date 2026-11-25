import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { type Configuration, configuration } from '@/config/configuration.js';
import { RedisResourcesService } from '@/redis/redis-resources.service.js';
import { RedisModule } from '@/redis/redis.module.js';

@Global()
@Module({
  imports: [
    RedisModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [configuration.KEY, RedisResourcesService],
      isGlobal: true,
      useFactory: async (config: Configuration, redisResources: RedisResourcesService) => {
        const { ttl } = config.cache;
        return redisResources.cacheStore ? { stores: [redisResources.cacheStore], ttl } : { ttl };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class AppCacheModule {}
