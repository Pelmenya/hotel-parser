import { Controller, HttpCode, Post, Put, Query } from '@nestjs/common';
import { DistrictsService } from './districts.service';

@Controller('districts')
export class DistrictsController {
    constructor(
        private readonly districtsService: DistrictsService,
    ) { }

    // 1. Запускает сохранение страниц в папке pages, формат страницы : page_111.json
    @Post('main-pages')
    @HttpCode(200)
    async saveMainPages(@Query() params: { start: number; end: number }): Promise<any> {
          return await this.districtsService.processSaveMainPagesAll(params.start,params.end);
    }
    
    // 2. Запускает создание облаcтей или регионов из страниц в папке pages, формат страницы : page_111.json
    @Post('from-pages')
    @HttpCode(200)
    async createDistrictsFromPages(): Promise<any> {
        return await this.districtsService.createDistrictsFromPages();
    }

    // 3. Запускает update числа страниц регионов из страниц в папке pages, формат страницы : page_111.json
    @Put('count-page')
    @HttpCode(200)
    async updateDistrictsCountPages(): Promise<any> {
      return await this.districtsService.updateDistrictsCountPages();
    }

    @Post('single-pages')
    @HttpCode(200)
    async saveDistrictPages(@Query() params: { districtLink: string }): Promise<any> {
      return await this.districtsService.saveDistrictPages(params.districtLink);
    }

    // 3. Запускает сохранение страниц в папку districts/<district.slug>page_1.json
    @Post('all-pages')
    @HttpCode(200)
    async saveDistrictsPagesAll(): Promise<any> {
      return await this.districtsService.processSaveAllDistricts();
    }
 
}
