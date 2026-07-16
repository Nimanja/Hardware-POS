import { PaymentMethod } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { ReturnItemInputDto } from './return-item-input.dto';

/**
 * Complete a return in one shot. The server reloads the sale, revalidates
 * quantities, recomputes every money figure (client amounts are never trusted),
 * verifies the approval token when required, and persists the whole return in a
 * single transaction.
 */
export class CreateReturnDto {
  @IsString()
  originalSaleId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items!: ReturnItemInputDto[];

  @IsEnum(PaymentMethod)
  refundMethod!: PaymentMethod;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  refundReference?: string;

  /** Method-specific extras (card terminal ref, transfer date, credit expiry…). */
  @IsObject()
  @IsOptional()
  refundMetadata?: Record<string, unknown>;

  /** Approval token from POST /returns/approve, required for high-risk returns. */
  @IsString()
  @IsOptional()
  approvalToken?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  /**
   * Idempotency key so a double-submitted completion returns the first return
   * instead of creating a duplicate. Also accepted via the `Idempotency-Key`
   * header.
   */
  @IsString()
  @IsOptional()
  @MaxLength(200)
  idempotencyKey?: string;
}
