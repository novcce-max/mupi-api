import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Setting } from './entities/setting.entity';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /** 未配置库或 manualInitialization 时 DataSource 未 initialize，无 entity metadata；勿调用 Repository。 */
  private assertDbReady(): void {
    if (!this.dataSource.isInitialized) {
      throw new ServiceUnavailableException(
        'Database is not available (configure DATABASE_URL and ensure Postgres is running)',
      );
    }
  }

  async getByKey(key: string): Promise<Setting | null> {
    if (!this.dataSource.isInitialized) {
      return null;
    }
    return this.settingsRepo.findOne({ where: { key } });
  }

  async getOrThrow(key: string): Promise<Setting> {
    this.assertDbReady();
    const existing = await this.getByKey(key);
    if (!existing) {
      throw new NotFoundException(`Setting not found for key: ${key}`);
    }
    return existing;
  }

  async ensureKey(key: string): Promise<Setting> {
    this.assertDbReady();
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
    const prev =
      setting.value &&
      typeof setting.value === 'object' &&
      !Array.isArray(setting.value)
        ? { ...setting.value }
        : {};
    const patch =
      dto.value && typeof dto.value === 'object' && !Array.isArray(dto.value)
        ? dto.value
        : null;
    const merged =
      patch != null
        ? ({ ...prev, ...patch } as Record<string, unknown>)
        : (dto.value ?? setting.value);
    const next: Setting = {
      ...setting,
      value: merged,
    };
    await this.settingsRepo.save(next);
    return next;
  }
}
