import { Injectable } from '@nestjs/common';
import { AboutsRepository } from './abouts.repository';
import { TOpenAIDataRes } from '../openai/openai.service';
import { Abouts } from './abouts.entity';

@Injectable()
export class AboutsService {
    constructor(
        private readonly aboutsRepository: AboutsRepository
    ) { }

    async saveOpenAIData(openAIData: TOpenAIDataRes, id: string): Promise<{}> {
        const aboutsEntityRu = new Abouts();

        aboutsEntityRu.title = openAIData.ru.aboutHotelDescriptionTitle;
        aboutsEntityRu.language = 'ru';
        aboutsEntityRu.descriptions = openAIData.ru.aboutHotelDescriptions;
        aboutsEntityRu.hotel = { id } as any;

        const aboutsRu = await this.aboutsRepository.save(aboutsEntityRu);

        const aboutsEntityEn = new Abouts();

        aboutsEntityEn.title = openAIData.en.aboutHotelDescriptionTitle;
        aboutsEntityEn.language = 'en';
        aboutsEntityEn.descriptions = openAIData.en.aboutHotelDescriptions;
        aboutsEntityEn.hotel = { id } as any;

        const aboutsEn =  await this.aboutsRepository.save(aboutsEntityEn);

        if (aboutsEn.language === 'en' && aboutsRu.language === 'ru') {
            return { succes : true } 
        } else {
            return {succes : false } 
        }

    }
}
