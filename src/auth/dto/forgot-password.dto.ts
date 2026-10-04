import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: '请输入有效邮箱' })
  @MaxLength(255)
  email: string;
}
