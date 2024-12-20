import { Injectable } from '@nestjs/common';
import { AboutsRepository } from './abouts.repository';
import { TOpenAIDataRes } from '../openai/openai.service';
import { Abouts } from './abouts.entity';
import { TSuccess } from 'src/types/t-success';
import { TAbout } from './abouts.types';
import { Hotels } from '../hotels/hotels.entity';

@Injectable()
export class AboutsService {
    constructor(
        private readonly aboutsRepository: AboutsRepository
    ) { }

    async saveOpenAIData(originalDescriptions: TAbout, openAIData: TOpenAIDataRes, hotel: Hotels): Promise<TSuccess> {

        let aboutsRu = await this.aboutsRepository.findOneByHotelId(hotel.id, 'ru');
        let aboutsEn = await this.aboutsRepository.findOneByHotelId(hotel.id, 'en');

        if (!aboutsRu) {
            const aboutsEntityRu = new Abouts();

            aboutsEntityRu.title = openAIData.ru.aboutHotelDescriptionTitle;
            aboutsEntityRu.language = 'ru';
            aboutsEntityRu.original_descriptions = originalDescriptions;
            aboutsEntityRu.descriptions = openAIData.ru.aboutHotelDescriptions;
            aboutsEntityRu.hotel = hotel;

            aboutsRu = await this.aboutsRepository.save(aboutsEntityRu);

        }

        if (!aboutsEn) {
            const aboutsEntityEn = new Abouts();

            aboutsEntityEn.title = openAIData.en.aboutHotelDescriptionTitle;
            aboutsEntityEn.language = 'en';
            aboutsEntityEn.original_descriptions = originalDescriptions;
            aboutsEntityEn.descriptions = openAIData.en.aboutHotelDescriptions;
            aboutsEntityEn.hotel = hotel;

            aboutsEn = await this.aboutsRepository.save(aboutsEntityEn);
        }

        return { success: aboutsEn.language === 'en' && aboutsRu.language === 'ru' }
    }
}



