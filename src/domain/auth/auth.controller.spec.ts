import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreModule } from '@/core.module.js';

import { AuthController } from './auth.controller.js';
import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';
import { GENDER } from './gender.enum.js';

describe('AuthController', () => {
  let controller: AuthController;
  let jwtService: JwtService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CoreModule, AuthModule],
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
