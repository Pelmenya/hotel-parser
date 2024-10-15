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
  // парсит в файлы все страницы отеле до page number
  @Get('russian-hotels')
  async getRussianHotels(@Query() params: { page: number }): Promise<{ success: boolean }> {
    return await this.parseService.parseRussianHotels(params.page);
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

  @Get('hotels')
  async getHotelsFromPages(): Promise<any> {
    return await this.parseService.getHotelsFromPages();
  }

  @Get('countries')
  async getCountries(): Promise<string> {
    return await this.parseService.parseCountries();
  }
}
