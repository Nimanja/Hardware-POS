import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(4, 8)
  @Matches(/^\d+$/, { message: 'pin must be numeric' })
  pin!: string;
}
