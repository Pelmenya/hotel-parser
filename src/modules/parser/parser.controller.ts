import { Controller, Get, HttpCode, Post, Put, Query } from '@nestjs/common';
import { ParserService } from './parser.service';

@Controller('parser')
export class ParserController {
  constructor(private readonly parseService: ParserService) { }

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

  // читает данные страницы отелей из созданного json файла при парсинге, для дальнейшей обработки или просмотра
  @Get('russian-hotel')
  async getRussianHotel(@Query() params: { page: number }): Promise<{ success: boolean }> {
    return await this.parseService.readDataPageRussianHotelsFromJson(params.page);
  }

  @Get('page-svg')
  async getSvg(@Query() params: { page: number }): Promise<{ success: boolean }> {
    return await this.parseService.extractSvgIconsFromCss(params.page);
  }

  @Post('hotels-from-pages')
  @HttpCode(200)
  async getHotelsFromPages(): Promise<any> {
    return await this.parseService.getHotelsFromPages();
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
