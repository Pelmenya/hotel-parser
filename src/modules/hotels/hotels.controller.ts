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

    // запускает создание отелей из страниц в папке pages/districts/<district>
    @Post('from-districts-pages')
    @HttpCode(200)
    async createHotelsFromDistrictPages(@Query() params: { district: string }): Promise<any> {
        return await this.hotelsService.createHotelsFromDistrictPages(params.district);
    }

    // запускает создание отелей из страниц в папке pages/districts/<district> на всех серверах
    @Post('from-districts-pages-all')
    @HttpCode(200)
    async createHotelsFromDistrictPagesAll(@Query() params: { district: string }): Promise<any> {
        return await this.hotelsService.processAllHotels();
    }

}
