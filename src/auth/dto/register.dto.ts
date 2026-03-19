import { IsString, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string;

  @IsString()
  @IsOptional()
  nickname?: string;
}
