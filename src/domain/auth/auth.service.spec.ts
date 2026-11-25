import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreModule } from '@/core.module.js';

import { AuthModule } from './auth.module.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CoreModule, AuthModule],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be able to validate user', () => {
    expect(service.validateUser({ email: 'hello@hello.com', password: 'hello' })).toBeDefined();
  });

  it('should be able to login', async () => {
    const payload = await service.login({
      id: '1',
      email: 'hello@hello.com',
    });
    expect(payload.token).toBeDefined();
    expect(jwtService.decode(payload.token).email).toEqual('hello@hello.com');
  });
});
