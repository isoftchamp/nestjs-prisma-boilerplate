import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreModule } from '@/core/core.module.js';
import { ENV, GENDER } from '@/shared/enums/index.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { LocalStrategy } from './strategies/local.strategy.js';

describe('AuthController', () => {
  let controller: AuthController;
  let jwtService: JwtService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CoreModule,
        PassportModule,
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
      providers: [AuthService, LocalStrategy, JwtStrategy],
      controllers: [AuthController],
    }).compile();

    controller = module.get(AuthController);
    jwtService = module.get(JwtService);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be able to login', async () => {
    const payload = await controller.login({
      id: '1',
      email: 'hello@hello.com',
    });
    expect(payload).toBeDefined();
    expect(jwtService.decode(payload.token).email).toEqual('hello@hello.com');
  });

  it('should be able to signup', async () => {
    vi.spyOn(authService, 'saveUser').mockImplementationOnce(async () => ({
      id: '1',
      email: 'hello@hello.com',
      password: 'hello',
      name: 'hello',
      gender: GENDER.MALE,
    }));
    const payload = await controller.signup({
      email: 'hello@hello.com',
      password: 'hello',
      name: 'hello',
    });
    expect(payload).toBeDefined();
    expect(payload.email).toEqual('hello@hello.com');
  });
});
