import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  /** 邮箱或历史手机号账号 */
  @IsString()
  @MinLength(3, { message: '请输入邮箱或手机号' })
  @MaxLength(255)
  identifier: string;

  @IsString()
  @MinLength(1, { message: '请输入密码' })
  @MaxLength(128)
  password: string;
}
