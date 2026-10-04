import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(32, { message: '重置链接无效' })
  @MaxLength(128)
  token: string;

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(128)
  password: string;
}
