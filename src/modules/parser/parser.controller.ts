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


}
