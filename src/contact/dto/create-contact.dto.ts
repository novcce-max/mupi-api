import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+()\-\s]{6,20}$/, {
    message: 'phone must be a valid phone number',
  })
  phone: string;

  // Frontend can submit without email (email field is optional).
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  // honeypot 字段，正常用户不应填写
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  fromPage?: string;

  @IsOptional()
  @IsString()
  visitorId?: string;

  @IsOptional()
  @IsString()
  sourceTag?: string;

  // 前端提交表单开始时间，用于防止过快提交
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startedAt?: number;
}
