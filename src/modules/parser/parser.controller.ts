import { Controller, Get } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
    constructor(private readonly parseService: ParserService) {}

    @Get('countries')
    async getCountries(): Promise<string> {
      return await this.parseService.parseCountries();
    }
}
