import { CustomerType } from '@hardware-pos/database';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/** All fields optional — only the provided ones are updated. */
export class UpdateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  companyName?: string;

  @IsEnum(CustomerType)
  @IsOptional()
  customerType?: CustomerType;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(400)
  billingAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(60)
  taxNumber?: string;

  @IsBoolean()
  @IsOptional()
  creditAllowed?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  creditLimit?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
