import { Controller, Get, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
  constructor(private readonly parseService: ParserService) { }

  @Get('page')
  async getPage(@Query() params: { page: number }): Promise<string> {
    return await this.parseService.parsePage({ page: params.page });
  }

  @Get('hotel')
  async getHotels(@Query() params: { page: number }): Promise<any> {
    return await this.parseService.parseHotelsByPage(params.page);
  }

  @Get('russian-hotels')
  async getRussianHotels(@Query() params: { page: number }): Promise<{ success: boolean }> {
    return await this.parseService.parseRussianHotels(params.page);
  }

  @Get('russian-hotel')
  async getRussianHotel(@Query() params: { page: number }): Promise<{ success: boolean }> {
    return await this.parseService.getPageRussianHotels(params.page);
  }

  @Get('countries')
  async getCountries(): Promise<string> {
    return await this.parseService.parseCountries();
  }
}
