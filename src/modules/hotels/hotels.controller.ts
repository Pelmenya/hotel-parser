import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { FilesService } from '../files/files.service';

@Controller('hotels')
export class HotelsController {
    constructor(
        private readonly hotelsService: HotelsService,
    ) { }

    // читает данные страницы отелей из созданного json файла при парсинге, для дальнейшей обработки или просмотра
    @Get()
    async getRussianHotelsByPageAndDistrict(@Query() params: { district: string; page: number }): Promise<{ success: boolean }> {
        return await this.hotelsService.getRussianHotelsByPageAndDistrict(params.district, params.page);
    }

    // запускает создание отелей из страниц в папке pages, формат страницы ex. page_111.json
    @Post('from-districts-pages')
    @HttpCode(200)
    async createHotelsFromDistrictsPages(@Query() params: { district: string }): Promise<any> {
        return await this.hotelsService.createHotelsFromDistrictsPages(params.district);
    }

}
