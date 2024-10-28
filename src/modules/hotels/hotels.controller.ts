import { Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { HotelsService } from './hotels.service';

@Controller('hotels')
export class HotelsController {
    constructor(
        private readonly hotelsService: HotelsService,
    ) { }

    // читает данные страницы отелей из созданного json файла при парсинге, для дальнейшей обработки или просмотра
    @Get('pages')
    async getRussianHotelsByPageAndDistrict(@Query() params: { district: string; page: number }): Promise<{ success: boolean }> {
        return await this.hotelsService.getRussianHotelsByPageAndDistrict(params.district, params.page);
    }

    @Get('page')
    async getRussinHotelBySlug(@Query() params: { slug: string }): Promise<{ success: boolean }> {
        return await this.hotelsService.getDataHotelFromJson(params.slug);
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

    // запускает сохранение страниц отелей  в папке pages/hotels/<hotelLink> на всех серверах
    @Post('pages')
    @HttpCode(200)
    async saveHotelsPages(): Promise<any> {
        return await this.hotelsService.saveHotelsPages();
    }

}
