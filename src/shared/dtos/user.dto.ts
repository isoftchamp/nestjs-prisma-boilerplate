import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { GENDER } from '../enums/index.js';

export class UserDto {
  @IsUUID()
  @ApiProperty({ description: 'ID', default: '66e1c5a0809bae0741157574' })
  id!: string;

  @IsEmail()
  @MaxLength(100)
  @ApiProperty({ description: 'Email', default: 'john@nest.com' })
  email!: string;

  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: 'Name', default: 'John' })
  name!: string;

  @IsEnum(GENDER)
  @IsOptional()
  @ApiProperty({ description: 'Gender', enum: GENDER })
  gender?: GENDER;
}

export class CreateUserDto extends OmitType(UserDto, ['id']) {
  @IsString()
  @MaxLength(100)
  @ApiProperty({ description: 'Password' })
  password!: string;
}
