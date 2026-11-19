import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { ENV } from '@/shared/enums/index.js';
import { AuthProcessor } from './processors/auth.processor.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get(ENV.USER_SECRET),
          signOptions: { expiresIn: configService.get(ENV.USER_TOKEN_EXPIRE_IN) },
        };
      },
    }),
  ],
  providers: [AuthProcessor],
  controllers: [],
  exports: [],
})
export class AuthModule {}
