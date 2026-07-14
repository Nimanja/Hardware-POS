import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateReturnSettingsDto {
  @IsInt()
  @Min(0)
  @Max(3650)
  @IsOptional()
  returnPeriodDays?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cashierReturnValueLimit?: number;

  @IsBoolean()
  @IsOptional()
  allowStoreCredit?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedRefundMethods?: string[];

  @IsBoolean()
  @IsOptional()
  requireApprovalForNonGoodCondition?: boolean;

  @IsBoolean()
  @IsOptional()
  requireApprovalForOtherReason?: boolean;

  @IsString()
  @IsOptional()
  quickbooksRefundReceiptDepositAccountRef?: string;
}

export class UpdateQuotationSettingsDto {
  @IsInt()
  @Min(0)
  @Max(3650)
  @IsOptional()
  defaultValidityDays?: number;

  @IsString()
  @IsOptional()
  defaultTermsAndConditions?: string;

  @IsString()
  @IsOptional()
  numberFormat?: string;

  @IsString()
  @IsOptional()
  revisionFormat?: string;

  @IsBoolean()
  @IsOptional()
  requireCustomer?: boolean;

  @IsBoolean()
  @IsOptional()
  allowWithoutStock?: boolean;

  @IsBoolean()
  @IsOptional()
  showStockAvailability?: boolean;

  @IsBoolean()
  @IsOptional()
  allowPriceOverride?: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  requireApprovalAboveDiscountPercent?: number;
}

export class UpdateDocumentSettingsDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  addressLine?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  taxNumber?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  footerText?: string;

  @IsIn(['A4', 'THERMAL_80'])
  @IsOptional()
  defaultPaperSize?: 'A4' | 'THERMAL_80';

  @IsIn(['PORTRAIT', 'LANDSCAPE'])
  @IsOptional()
  orientation?: 'PORTRAIT' | 'LANDSCAPE';

  @IsBoolean()
  @IsOptional()
  showProductImages?: boolean;

  @IsBoolean()
  @IsOptional()
  showSku?: boolean;

  @IsBoolean()
  @IsOptional()
  showTaxColumn?: boolean;

  @IsBoolean()
  @IsOptional()
  showDiscountColumn?: boolean;

  @IsIn(['A4', 'THERMAL', 'BOTH'])
  @IsOptional()
  defaultBillFormat?: 'A4' | 'THERMAL' | 'BOTH';

  @IsBoolean()
  @IsOptional()
  signatureFields?: boolean;
}

export class UpdateSharingSettingsDto {
  @IsString()
  @IsOptional()
  emailSenderName?: string;

  @IsString()
  @IsOptional()
  emailSenderAddress?: string;

  @IsString()
  @IsOptional()
  emailSubjectTemplate?: string;

  @IsString()
  @IsOptional()
  emailBodyTemplate?: string;

  @IsString()
  @IsOptional()
  whatsappMessageTemplate?: string;

  @IsInt()
  @Min(0)
  @Max(3650)
  @IsOptional()
  shareLinkExpirationDays?: number;

  @IsInt()
  @Min(0)
  @Max(3650)
  @IsOptional()
  pdfStorageDurationDays?: number;
}

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxRatePercent?: number;

  @IsBoolean()
  @IsOptional()
  taxInclusive?: boolean;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  highDiscountThresholdPercent?: number;

  @IsString()
  @IsOptional()
  receiptFooter?: string;

  @ValidateNested()
  @Type(() => UpdateReturnSettingsDto)
  @IsOptional()
  returns?: UpdateReturnSettingsDto;

  @ValidateNested()
  @Type(() => UpdateQuotationSettingsDto)
  @IsOptional()
  quotation?: UpdateQuotationSettingsDto;

  @ValidateNested()
  @Type(() => UpdateDocumentSettingsDto)
  @IsOptional()
  documents?: UpdateDocumentSettingsDto;

  @ValidateNested()
  @Type(() => UpdateSharingSettingsDto)
  @IsOptional()
  sharing?: UpdateSharingSettingsDto;
}
