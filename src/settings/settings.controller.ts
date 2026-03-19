import { Controller, Get, Param } from '@nestjs/common';

import { SettingsService } from './settings.service';
import { KeyParamDto } from '../common/dto/key-param.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get(':key')
  async getValue(@Param() param: KeyParamDto) {
    const setting = await this.settingsService.getByKey(param.key);
    return setting ? setting.value : null;
  }
}
