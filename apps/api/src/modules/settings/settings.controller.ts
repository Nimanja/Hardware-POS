import { Body, Controller, Get, Put } from '@nestjs/common';

import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AppSettings } from './settings.interfaces';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@TenantId() tenantId: string): AppSettings {
    return this.settingsService.getSettings(tenantId);
  }

  @Put()
  updateSettings(
    @TenantId() tenantId: string,
    @Body() dto: UpdateSettingsDto,
  ): Promise<AppSettings> {
    return this.settingsService.updateSettings(tenantId, dto);
  }
}
