import { DiscountType } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { QuotationItemInputDto } from './quotation-item.dto';

export class CreateQuotationDto {
  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  termsAndConditions?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  quotationDiscountType?: DiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quotationDiscountValue?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemInputDto)
  items!: QuotationItemInputDto[];

  /** Save as a draft, or issue immediately (SENT). Defaults to DRAFT. */
  @IsIn(['DRAFT', 'SENT'])
  @IsOptional()
  status?: 'DRAFT' | 'SENT';
}
