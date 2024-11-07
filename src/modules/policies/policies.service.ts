import { Injectable } from '@nestjs/common';
import { TTranslateText } from 'src/types/t-translate-text';
import { Hotels } from '../hotels/hotels.entity';
import { TSettlementConditions } from './policies.types';
import { PoliciesRepository } from './policies.repository';
import { Policies } from './policies.entity';

@Injectable()
export class PoliciesService {
    constructor(
        private readonly policiesRepository: PoliciesRepository,
    ) { }

    async savePolicies(
        hotelId: string,
        titles: TTranslateText,
        policiesData: Array<TTranslateText & TSettlementConditions>,
    ) {

        // Типизируем объект отеля
        const hotel: Hotels = { id: hotelId } as Hotels;

        // Проверяем наличие записи для русского языка
        let policiesRu = await this.policiesRepository.findByHotelLanguageAndTitle(
            hotelId,
            'ru',
            titles.original
        );

        // Если такой записи не существует, создаем новую
        if (!policiesRu) {
            policiesRu = new Policies();
            policiesRu.hotel = hotel;
            policiesRu.language = 'ru';
            policiesRu.title = titles.original;
            policiesRu.policy = [{
                idx: policiesData[0].idx,
                title: policiesData[0].title,
                in: policiesData[0].in,
                out: policiesData[0].out
            }];
            await this.policiesRepository.save(policiesRu);
        }

        // Проверяем наличие записи для английского языка
        let policiesEn = await this.policiesRepository.findByHotelLanguageAndTitle(
            hotelId,
            'en',
            titles.translated
        );

        // Если такой записи не существует, создаем новую
        if (!policiesEn) {
            policiesEn = new Policies();
            policiesEn.hotel = hotel;
            policiesEn.language = 'en';
            policiesEn.title = titles.original;
            policiesEn.policy = [{
                idx: policiesData[1].idx,
                title: policiesData[1].title,
                in: policiesData[1].in,
                out: policiesData[1].out
            }];

            await this.policiesRepository.save(policiesEn);
        }

        return policiesEn.language === 'en' && policiesRu.language === 'ru';
    }
}

