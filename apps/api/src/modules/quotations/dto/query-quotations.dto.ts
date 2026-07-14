import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

const STATUS_VALUES = [
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'REVISED',
  'CONVERTED_TO_SALE',
  'CANCELLED',
] as const;

export class QueryQuotationsDto extends PaginationQueryDto {
  /** Free-text across quotation number, customer name / phone / company. */
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(STATUS_VALUES)
  @IsOptional()
  status?: (typeof STATUS_VALUES)[number];

  @IsString()
  @IsOptional()
  customerId?: string;

  @IsString()
  @IsOptional()
  createdByUserId?: string;

  /** issueDate range (inclusive). */
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  /** Validity filter: only-valid or only-expired by validUntil. */
  @IsIn(['valid', 'expired'])
  @IsOptional()
  validity?: 'valid' | 'expired';

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minTotal?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxTotal?: number;

  @IsIn(['createdAt', 'issueDate', 'validUntil', 'grandTotal', 'quotationNumber'])
  @IsOptional()
  sortBy?: 'createdAt' | 'issueDate' | 'validUntil' | 'grandTotal' | 'quotationNumber';

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortDir?: 'asc' | 'desc';
}
