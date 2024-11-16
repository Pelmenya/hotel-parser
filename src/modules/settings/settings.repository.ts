import { Repository } from 'typeorm';
import { Settings } from './settings.entity';
import { InjectRepository } from '@nestjs/typeorm';


export class SettingsRepository {
    constructor(
        @InjectRepository(Settings)
        private settingsRepository: Repository<Settings>,
    ) { }


    async getSetting(key: string): Promise<Settings | undefined> {
        return this.settingsRepository.findOne({ where: { key } });
    }

    async updateSetting(key: string, value: string): Promise<Settings> {
        let setting = await this.getSetting(key);
        if (!setting) {
            setting = this.settingsRepository.create({ key, value });
        } else {
            setting.value = value;
        }
        return this.settingsRepository.save(setting);
    }
}
