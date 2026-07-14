import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSubcategoryDto {
  @IsString()
  @MinLength(1)
  categoryId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSubcategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(140)
  slug?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/** Move a subcategory under a different parent category. */
export class MoveSubcategoryDto {
  @IsString()
  @MinLength(1)
  categoryId!: string;
}
