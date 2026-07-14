import { IsNumber, IsOptional, IsPositive, IsString, Length, Matches, MaxLength } from 'class-validator';

/**
 * A cashier submits a manager's PIN to authorise a high-risk return. Returns a
 * short-lived approval token to attach to the return at completion. Mirrors
 * POST /discounts/approve.
 */
export class ApproveReturnDto {
  @IsString()
  @Length(4, 8)
  @Matches(/^\d+$/, { message: 'managerPin must be numeric' })
  managerPin!: string;

  @IsString()
  originalSaleId!: string;

  @IsNumber()
  @IsPositive()
  refundTotal!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
