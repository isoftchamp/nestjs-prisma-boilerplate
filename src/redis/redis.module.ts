import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RedisResourcesService } from './redis-resources.service.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisResourcesService],
  exports: [RedisResourcesService],
})
export class RedisModule {}
