import { PaymentMethod } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ReturnItemInputDto } from './return-item-input.dto';

/** Ask the server to compute a refund preview for a selection of sale lines. */
export class PreviewReturnDto {
  @IsString()
  originalSaleId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items!: ReturnItemInputDto[];

  /** Optional — lets the preview flag a refund-method-driven approval requirement. */
  @IsEnum(PaymentMethod)
  @IsOptional()
  refundMethod?: PaymentMethod;
}
