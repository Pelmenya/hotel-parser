import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('run')
  async getRunFlag(): Promise<{ run: boolean }> {
    const run = await this.settingsService.getRunFlag();
    return { run };
  }

  @Post('run')
  async setRunFlag(@Body('value') value: boolean): Promise<void> {
    await this.settingsService.setRunFlag(value);
  }
}
