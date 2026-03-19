import { IsString, Matches } from 'class-validator';

export class IdParamDto {
  @IsString()
  @Matches(/^\d+$/, { message: 'id must be a numeric string' })
  id: string;
}
