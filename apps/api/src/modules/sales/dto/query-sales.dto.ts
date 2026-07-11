import { PaymentStatus, SyncStatus } from '@hardware-pos/database';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QuerySalesDto extends PaginationQueryDto {
  /** Optionally filter the sales history by sync status (e.g. FAILED). */
  @IsEnum(SyncStatus)
  @IsOptional()
  syncStatus?: SyncStatus;

  /** Filter by payment status (PAID / PARTIAL / UNPAID / REFUNDED). */
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  /** Free-text search over sale number or customer name. */
  @IsString()
  @IsOptional()
  @MaxLength(120)
  search?: string;

  /** Inclusive lower bound on sale creation date (ISO string). */
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  /** Inclusive upper bound on sale creation date (ISO string). */
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateTo?: Date;
}
