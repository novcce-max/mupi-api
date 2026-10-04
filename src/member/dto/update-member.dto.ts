import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @IsString()
  @MinLength(1, { message: '昵称不能为空' })
  @MaxLength(100, { message: '昵称不能超过 100 个字符' })
  nickname: string;
}
