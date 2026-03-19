import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  password: string;
}
