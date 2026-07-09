import { DiscountType } from '@hardware-pos/database';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class ApproveDiscountDto {
  @IsString()
  @Length(4, 8)
  @Matches(/^\d+$/, { message: 'managerPin must be numeric' })
  managerPin!: string;

  @IsEnum(DiscountType)
  discountType!: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue!: number;

  @IsString()
  @IsOptional()
  saleItemId?: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
