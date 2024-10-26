import { Controller, HttpCode, Post, Put, Query } from '@nestjs/common';
import { DistrictsService } from './districts.service';

@Controller('districts')
export class DistrictsController {
    constructor(
        private readonly districtsService: DistrictsService,
    ) { }

    // запускает сохранение страниц в папке pages, формат страницы : page_111.json
    @Post('main-pages')
    @HttpCode(200)
    async saveMainPages(@Query() params: { start: number; end: number }): Promise<any> {
          return await this.districtsService.processSaveMainPagesAll(params.start,params.end);
    }
    
    // запускает создание облаcтей или регионов из страниц в папке pages, формат страницы : page_111.json
    @Post('from-pages')
    @HttpCode(200)
    async createDistrictsFromPages(): Promise<any> {
        return await this.districtsService.createDistrictsFromPages();
    }

    @Post('single-pages')
    @HttpCode(200)
    async createDistrictPages(@Query() params: { districtLink: string }): Promise<any> {
      return await this.districtsService.createDistrictPages(params.districtLink);
    }
  
    @Post('all-pages')
    @HttpCode(200)
    async createDistrictsPagesAll(): Promise<any> {
      return await this.districtsService.processAllDistricts();
    }
  
    @Put('count-page')
    @HttpCode(200)
    async updateDistrictsCountPages(): Promise<any> {
      return await this.districtsService.updateDistrictsCountPages();
    }
}
