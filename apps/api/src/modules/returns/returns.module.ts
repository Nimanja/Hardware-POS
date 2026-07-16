import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';
import { SyncModule } from '../sync/sync.module';
import { ReturnsController } from './returns.controller';
import { ReturnsSalesController } from './returns-sales.controller';
import { ReturnsRepository } from './returns.repository';
import { ReturnsService } from './returns.service';

@Module({
  imports: [AuthModule, SettingsModule, SyncModule],
  controllers: [ReturnsController, ReturnsSalesController],
  providers: [ReturnsService, ReturnsRepository],
  exports: [ReturnsService],
})
export class ReturnsModule {}
