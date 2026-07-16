import { Module } from '@nestjs/common';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { DocumentsModule } from '../documents/documents.module';
import { SettingsModule } from '../settings/settings.module';
import { MailService } from './mail.service';
import { SharingService } from './sharing.service';

@Module({
  imports: [SettingsModule, AuditLogModule, DocumentsModule],
  providers: [SharingService, MailService],
  exports: [SharingService, MailService],
})
export class SharingModule {}
