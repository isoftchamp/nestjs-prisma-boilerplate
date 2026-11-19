import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { type HashOptions, argon2id, hash, verify } from 'argon2';

import { PrismaService } from '../../../core/database/prisma.service.js';

export type AuthenticatedUser = Omit<User, 'password'>;

const ARGON2_OPTIONS: HashOptions = {
  type: argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthenticatedUser | null> {
    const user = await this.findUserByEmail(email);

    if (!user) {
      return null;
    }

    if (!(await verify(user.password, password))) {
      return null;
    }

    const { password: _password, ...authenticatedUser } = user;
    return authenticatedUser;
  }

  async login(user: Pick<User, 'email' | 'id'>) {
    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  public async saveUser(data: Prisma.UserCreateInput): Promise<User> {
    data.password = await hash(data.password, ARGON2_OPTIONS);
    try {
      return await this.prisma.user.create({
        data,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Email already in use. Please try a different email.');
      }
      throw error;
    }
  }
}
