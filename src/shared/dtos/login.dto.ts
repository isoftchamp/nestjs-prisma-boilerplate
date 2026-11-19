import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { CreateUserDto } from './user.dto.js';

export class LoginDto extends PickType(CreateUserDto, ['email', 'password']) {}

export class LoginSuccessDto {
  @IsString()
  @ApiProperty({ description: 'JWT token' })
  token!: string;
}
