import { Controller, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
  constructor(private readonly parseService: ParserService) { }

  //Для получения html страницы запросом get
  @Get('page')
  async getPage(@Query() params: { page: number }): Promise<string> {
    return await this.parseService.parsePage({ page: params.page });
  }

  @Get('hotels')
  async getHotels(@Query() params: { page: number }): Promise<any> {
    return await this.parseService.parseHotelsByPage(params.page);
  }

  // парсит в файлы все страницы отелей от start number до end number
  @Post('russian-hotels')
  @HttpCode(200)
  async getRussianHotels(@Query() params: { start: number; end: number }): Promise<{ success: boolean }> {
    return await this.parseService.parseRussianHotels(params.start, params.end);
  }

  @Post('districts')
  @HttpCode(200)
  async getDistrictsFromPages(): Promise<any> {
    return await this.parseService.getDistrictsFromPages();
  }

  @Post('district-pages')
  @HttpCode(200)
  async getDistrictsPages(@Query() params: { districtLink: string }): Promise<any> {
    return await this.parseService.parseDistrictPages(params.districtLink);
  }

  @Post('district-pages-all')
  @HttpCode(200)
  async getDistrictsPagesAll(): Promise<any> {
    return await this.parseService.processAllDistricts();
  }

  @Put('districts-count-page')
  @HttpCode(200)
  async updateDistrictCountPage(): Promise<any> {
    return await this.parseService.updateDistrictCounts();
  }

  @Get('countries')
  async getCountries(): Promise<string> {
    return await this.parseService.parseCountries();
  }
}
