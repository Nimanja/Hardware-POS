import { PaymentMethod, RefundStatus, ReturnStatus, SyncStatus } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryReturnsDto extends PaginationQueryDto {
  @IsEnum(ReturnStatus)
  @IsOptional()
  status?: ReturnStatus;

  @IsEnum(RefundStatus)
  @IsOptional()
  refundStatus?: RefundStatus;

  @IsEnum(SyncStatus)
  @IsOptional()
  syncStatus?: SyncStatus;

  @IsEnum(PaymentMethod)
  @IsOptional()
  refundMethod?: PaymentMethod;

  /** Free-text search over return number, original sale number, or customer name. */
  @IsString()
  @IsOptional()
  @MaxLength(120)
  search?: string;

  @IsString()
  @IsOptional()
  originalSaleId?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;
}
