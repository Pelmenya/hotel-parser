import { Controller, HttpCode, Post, Put, Query } from '@nestjs/common';
import { DistrictsService } from './districts.service';

@Controller('districts')
export class DistrictsController {
    constructor(
        private readonly districtsService: DistrictsService,
    ) { }

    // запускает создание облачтей или регионов из страниц в папке pages, формат страницы : page_111.json
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
    async updateDistrictCountPage(): Promise<any> {
      return await this.districtsService.updateDistrictCounts();
    }
}
