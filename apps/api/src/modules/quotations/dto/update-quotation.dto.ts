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
  Min,
  ValidateNested,
} from 'class-validator';

import { QuotationItemInputDto } from './quotation-item.dto';

/**
 * Edit a DRAFT quotation in place (mutates the current revision). All fields are
 * optional; when `items` is present it replaces the current line set. Totals are
 * always recomputed on the server.
 */
export class UpdateQuotationDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  /** Pass an empty string to clear an order-level discount. */
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
  @IsOptional()
  items?: QuotationItemInputDto[];
}
