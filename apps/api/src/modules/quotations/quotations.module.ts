import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { DocumentsModule } from '../documents/documents.module';
import { SalesModule } from '../sales/sales.module';
import { SettingsModule } from '../settings/settings.module';
import { SharingModule } from '../sharing/sharing.module';
import { PublicQuotationsController } from './public-quotations.controller';
import { QuotationsController } from './quotations.controller';
import { QuotationsRepository } from './quotations.repository';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [SettingsModule, AuditLogModule, SalesModule, DocumentsModule, SharingModule],
  controllers: [QuotationsController, PublicQuotationsController],
  providers: [QuotationsService, QuotationsRepository],
  exports: [QuotationsService, QuotationsRepository],
})
export class QuotationsModule {}
