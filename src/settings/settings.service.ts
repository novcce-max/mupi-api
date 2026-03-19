import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async getByKey(key: string): Promise<Setting | null> {
    return this.settingsRepo.findOne({ where: { key } });
  }

  async getOrThrow(key: string): Promise<Setting> {
    const existing = await this.getByKey(key);
    if (!existing) {
      throw new NotFoundException(`Setting not found for key: ${key}`);
    }
    return existing;
  }

  async ensureKey(key: string): Promise<Setting> {
    const existing = await this.getByKey(key);
    if (existing) return existing;
    const created = this.settingsRepo.create({
      key,
      value: {},
    });
    return this.settingsRepo.save(created);
  }

  async adminGet(key: string): Promise<Setting> {
    return this.ensureKey(key);
  }

  async adminUpdate(key: string, dto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.ensureKey(key);
    const next: Setting = {
      ...setting,
      value: dto.value ?? setting.value,
    };
    await this.settingsRepo.save(next);
    return next;
  }
}
