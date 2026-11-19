import { InjectQueue } from '@nestjs/bullmq';
import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type User as PrismaUser } from '@prisma/client';
import { Queue } from 'bullmq';

import { ApiMyResponse, User } from '../../../shared/decorators/index.js';
import { CreateUserDto, LoginDto, LoginSuccessDto, UserDto } from '../../../shared/dtos/index.js';
import { AUTH_JOB, QUEUE } from '../../../shared/enums/index.js';
import { LocalAuthGuard } from '../../../shared/guards/index.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectQueue(QUEUE.AUTH_QUEUE) private userQueue: Queue,
    private readonly logger: Logger,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/password' })
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    type: LoginDto,
  })
  @ApiMyResponse({ status: 200, type: LoginSuccessDto })
  @ApiMyResponse({ status: 401 })
  async login(@User() user: Pick<PrismaUser, 'email' | 'id'>): Promise<{ token: string }> {
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiMyResponse({ status: 201, type: UserDto })
  @ApiMyResponse({ status: 400 })
  async signup(@Body() body: CreateUserDto) {
    const data = await this.authService.saveUser(body);
    const { password: _password, ...user } = data;

    try {
      await this.userQueue.add(AUTH_JOB.SEND_SIGNUP_EMAIL, user);
    } catch (error) {
      try {
        await this.authService.deleteUser(data.id);
      } catch (rollbackError) {
        this.logger.error('Failed to roll back user registration', rollbackError);
      }
      throw error;
    }

    return user;
  }
}
