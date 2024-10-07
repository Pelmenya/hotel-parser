import { Controller, Get, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
    constructor(private readonly parseService: ParserService) {}

    @Get('page')
    async getPage(@Query() params: any): Promise<string> {
      return await this.parseService.parsePage(params);
    }

    @Get('countries')
    async getCountries(): Promise<string> {
      return await this.parseService.parseCountries();
    }
}
