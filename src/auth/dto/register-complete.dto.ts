import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterCompleteDto {
  @IsEmail({}, { message: '请输入有效邮箱' })
  @MaxLength(255)
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: '验证码为 6 位数字' })
  code: string;

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(128)
  password: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;
}
