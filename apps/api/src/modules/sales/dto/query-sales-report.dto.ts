import { IsIn } from 'class-validator';

import { QuerySalesDto } from './query-sales.dto';

/**
 * Filters for the exported sales report — identical to the list filters
 * (pagination fields are inherited but ignored; the report covers every
 * matching sale up to the server-side cap) plus the output format.
 */
export class QuerySalesReportDto extends QuerySalesDto {
  @IsIn(['pdf', 'xlsx'])
  format!: 'pdf' | 'xlsx';
}
