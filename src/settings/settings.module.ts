import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Setting } from './entities/setting.entity';
import { SettingsService } from './settings.service';
import { SettingsAdminController } from './settings-admin.controller';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingsAdminController, SettingsController],
  providers: [SettingsService],
  exports: [TypeOrmModule, SettingsService],
})
export class SettingsModule {}
