import { IsArray, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShareWhatsappDto {
  /** Override the customer phone (E.164-ish or local); country code handled server-side. */
  @IsString()
  @IsOptional()
  phone?: string;
}

export class ShareEmailDto {
  @IsEmail()
  @IsOptional()
  to?: string;

  @IsArray()
  @IsEmail({}, { each: true })
  @IsOptional()
  cc?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(200)
  subject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
  message?: string;
}
