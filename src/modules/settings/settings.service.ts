import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingsRepository } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getRunFlag(): Promise<boolean> {
    const setting = await this.settingsRepository.getSetting('run');
    return setting ? setting.value === 'true' : false;
  }

  async setRunFlag(value: boolean): Promise<void> {
    await this.settingsRepository.updateSetting('run', String(value));
  }
}
