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

        let aboutsRu = await this.aboutsRepository.findOneByHotelId(id, 'ru');
        let aboutsEn = await this.aboutsRepository.findOneByHotelId(id, 'en');

        if (!aboutsRu) {
            const aboutsEntityRu = new Abouts();

            aboutsEntityRu.title = openAIData.ru.aboutHotelDescriptionTitle;
            aboutsEntityRu.language = 'ru';
            aboutsEntityRu.descriptions = openAIData.ru.aboutHotelDescriptions;
            aboutsEntityRu.hotel = { id } as any;

            aboutsRu = await this.aboutsRepository.save(aboutsEntityRu);
        }

        if (!aboutsEn) {
            const aboutsEntityEn = new Abouts();

            aboutsEntityEn.title = openAIData.en.aboutHotelDescriptionTitle;
            aboutsEntityEn.language = 'en';
            aboutsEntityEn.descriptions = openAIData.en.aboutHotelDescriptions;
            aboutsEntityEn.hotel = { id } as any;

            aboutsEn = await this.aboutsRepository.save(aboutsEntityEn);
        }

        if (aboutsEn.language === 'en' && aboutsRu.language === 'ru') {
            return { succes: true }
        } else {
            return { succes: false }
        }
    }
}

