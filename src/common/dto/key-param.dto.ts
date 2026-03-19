import { IsNotEmpty, IsString } from 'class-validator';

export class KeyParamDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}
