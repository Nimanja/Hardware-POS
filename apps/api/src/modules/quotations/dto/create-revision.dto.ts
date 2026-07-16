import { DiscountType } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { QuotationItemInputDto } from './quotation-item.dto';

/**
 * Create a NEW immutable revision of an already-issued quotation. Preserves the
 * prior revision; bumps the revision number (R1, R2, …).
 */
export class CreateRevisionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeReason?: string;

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  quotationDiscountType?: DiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quotationDiscountValue?: number;

  @IsBoolean()
  @IsOptional()
  clearQuotationDiscount?: boolean;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemInputDto)
  items!: QuotationItemInputDto[];
}
