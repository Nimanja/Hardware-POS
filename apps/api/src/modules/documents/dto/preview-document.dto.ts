import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, ValidateNested } from 'class-validator';

import { UpdateDocumentSettingsDto } from '../../settings/dto/update-settings.dto';

/**
 * Body for `POST /documents/preview/:type`. `documents` carries UNSAVED document
 * settings so the admin can preview template changes before saving; `lineCount`
 * lets the preview demonstrate multi-page output.
 */
export class PreviewDocumentDto {
  @ValidateNested()
  @Type(() => UpdateDocumentSettingsDto)
  @IsOptional()
  documents?: UpdateDocumentSettingsDto;

  @IsInt()
  @Min(1)
  @Max(80)
  @IsOptional()
  lineCount?: number;
}
