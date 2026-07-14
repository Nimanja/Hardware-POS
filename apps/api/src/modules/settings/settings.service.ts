import { Injectable, NotImplementedException } from '@nestjs/common';
import { DEFAULT_CURRENCY } from '@hardware-pos/shared';

import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './settings.interfaces';

/**
 * Placeholder settings service. Returns sensible defaults for now; persistence
 * (a per-tenant settings table) will be added later.
 */
@Injectable()
export class SettingsService {
  getSettings(_tenantId: string): AppSettings {
    return {
      currency: DEFAULT_CURRENCY,
      taxRatePercent: 0,
      taxInclusive: false,
      highDiscountThresholdPercent: 10,
      receiptFooter: 'Thank you for your purchase!',
      returns: {
        returnPeriodDays: 30,
        cashierReturnValueLimit: 5000,
        allowStoreCredit: true,
        allowedRefundMethods: ['CASH', 'CARD', 'BANK_TRANSFER', 'STORE_CREDIT'],
        requireApprovalForNonGoodCondition: true,
        requireApprovalForOtherReason: false,
        quickbooksRefundReceiptDepositAccountRef: null,
      },
      quotation: {
        defaultValidityDays: 14,
        defaultTermsAndConditions:
          'This quotation is valid until the date shown above. Prices are subject to stock availability at the time of order. Goods once sold are subject to our standard return policy.',
        numberFormat: 'QT-{seq}',
        revisionFormat: '{number}-R{rev}',
        requireCustomer: false,
        allowWithoutStock: true,
        showStockAvailability: true,
        allowPriceOverride: true,
        requireApprovalAboveDiscountPercent: 15,
      },
      documents: {
        companyName: null,
        addressLine: null,
        phone: null,
        email: null,
        taxNumber: null,
        logoUrl: null,
        footerText: 'Thank you for your business!',
        defaultPaperSize: 'A4',
        orientation: 'PORTRAIT',
        showProductImages: false,
        showSku: true,
        showTaxColumn: true,
        showDiscountColumn: true,
        defaultBillFormat: 'A4',
        signatureFields: true,
      },
      sharing: {
        emailSenderName: 'Hardware POS',
        emailSenderAddress: null,
        emailSubjectTemplate: 'Quotation {quotationNumber} from {businessName}',
        emailBodyTemplate:
          'Hello {customerName},\n\nPlease find attached quotation {quotationNumber}.\n\nThis quotation is valid until {validUntil}.\n\nThank you.',
        whatsappMessageTemplate:
          'Hello {customerName}, please find your quotation {quotationNumber} from {businessName}. The quotation is valid until {validUntil}.',
        shareLinkExpirationDays: 30,
        pdfStorageDurationDays: 90,
      },
    };
  }

  /** TODO: persist per-tenant settings. */
  updateSettings(_tenantId: string, _dto: UpdateSettingsDto): Promise<AppSettings> {
    throw new NotImplementedException('Updating settings is not implemented yet');
  }
}
