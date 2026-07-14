import { ItemCondition, ReturnReason, StockDisposition } from '@hardware-pos/database';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

/** One line the cashier chose to return. */
export class ReturnItemInputDto {
  @IsString()
  saleItemId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  returnQuantity!: number;

  @IsEnum(ReturnReason)
  returnReason!: ReturnReason;

  @IsEnum(ItemCondition)
  itemCondition!: ItemCondition;

  @IsEnum(StockDisposition)
  stockDisposition!: StockDisposition;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
