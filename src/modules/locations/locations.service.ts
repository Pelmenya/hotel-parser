import { Inject, Injectable } from '@nestjs/common';
import { LocationsRepository } from './locations.repository';
import { TranslationService } from '../translation/translation.service';
import { TAddress } from 'src/types/t-address-response';
import { TTranslationName } from '../translation/translation.types';
import { Locations } from './locations.entity';
import { Hotels } from '../hotels/hotels.entity';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class LocationsService {
    private readonly BATCH_SIZE = 5;
    private readonly MAX_ATTEMPTS = 3;
    private readonly RETRY_DELAY_MS = 1000; // 1 second

    constructor(
        private readonly locationsRepository: LocationsRepository,
        private readonly translationService: TranslationService,
        private readonly settingsService: SettingsService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) {
        //this.init();
    }

    private async init() {
        try {
            const shouldRun = await this.settingsService.getRunFlag();
            if (shouldRun) {
                await this.processTranslateAddressesFromRussianToEnglish();
            }
        } catch (error) {
            this.logger.error('Error initializing LocationsService:', error.stack);
        }
    }

    async processTranslateAddressesFromRussianToEnglish(): Promise<void> {
        try {
            while (true) {
                const shouldRun = await this.settingsService.getRunFlag();
                if (!shouldRun) {
                    this.logger.info('Run flag is false. Stopping translation process.');
                    break;
                }

                const locations = await this.translateAddressesFromRussianToEnglish(this.BATCH_SIZE);
                if (locations.length === 0) {
                    this.logger.info('No more locations to translate.');
                    break;
                }

                this.logger.info(`Translated ${locations.length} addresses to English.`);
            }
        } catch (error) {
            this.logger.error('Error during address translation process:', error.stack);
        }
    }

    async translateAddressesFromRussianToEnglish(batch: number): Promise<Locations[]> {
        try {
            const locations = await this.locationsRepository.findRussianLocationsWithoutEnglishTranslation(batch);

            const translationPromises = locations.map(async (location) => {
                for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
                    try {
                        const translatedGeocodeData = await this.translateGeocodeData(location.geocode_data);

                        const hotelId = await this.locationsRepository.findHotelId(location.id);
                        if (!hotelId) {
                            throw new Error(`Hotel not found for location with ID: ${location.id}`);
                        }

                        const newLocation = new Locations();
                        newLocation.hotel = { id: hotelId } as Hotels;
                        newLocation.language = 'en';
                        newLocation.address = translatedGeocodeData.pretty;
                        newLocation.geocode_data = translatedGeocodeData;

                        await this.locationsRepository.save(newLocation);
                        location.is_translated_to_en = true;
                        await this.locationsRepository.save(location);

                        this.logger.info(`Successfully translated location with ID: ${location.id}`);

                        return newLocation;
                    } catch (error) {
                        this.logger.error(`Error translating location with ID: ${location.id} on attempt ${attempt}: ${error.stack}`);
                        if (attempt < this.MAX_ATTEMPTS) {
                            this.logger.warn(`Retrying translation for location with ID: ${location.id} after ${this.RETRY_DELAY_MS}ms`);
                            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
                        } else {
                            throw error;
                        }
                    }
                }
            });

            return await Promise.all(translationPromises);
        } catch (error) {
            this.logger.error('Error during batch translation', error.stack);
            throw error;
        }
    }

    private async translateLocation(location: Locations): Promise<Locations> {
        for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
            try {
                const translatedGeocodeData = await this.translateGeocodeData(location.geocode_data);

                const hotelId = await this.locationsRepository.findHotelId(location.id);
                if (!hotelId) {
                    throw new Error(`Hotel not found for location with ID: ${location.id}`);
                }

                const newLocation = new Locations();
                newLocation.hotel = { id: hotelId } as Hotels;
                newLocation.language = 'en';
                newLocation.address = translatedGeocodeData.pretty;
                newLocation.geocode_data = translatedGeocodeData;

                await this.locationsRepository.save(newLocation);
                location.is_translated_to_en = true;
                await this.locationsRepository.save(location);

                this.logger.info(`Successfully translated location with ID: ${location.id}`);

                return newLocation;
            } catch (error) {
                this.logger.error(`Error translating location with ID: ${location.id} on attempt ${attempt}: ${error.stack}`);
                if (attempt < this.MAX_ATTEMPTS) {
                    this.logger.warn(`Retrying translation for location with ID: ${location.id} after ${this.RETRY_DELAY_MS}ms`);
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
                } else {
                    throw error;
                }
            }
        }
    }

    // Перевод данных geocode_data
    private async translateGeocodeData(geocodeData: TAddress): Promise<TAddress> {
        const translatedGeocodeData = { ...geocodeData };

        const translateField = async (text: string | undefined, name: TTranslationName) => {
            if (text && !/^\d+$/.test(text)) { // Проверяем, что текст не является числом
                return this.translationService.translateText(name, text, 'en');
            }
            return text;
        };

        // Переводим 'areas'
        if (geocodeData.areas) {
            if (geocodeData.areas.admin_area) {
                translatedGeocodeData.areas.admin_area.name = await translateField(geocodeData.areas.admin_area.name, 'address part');
                translatedGeocodeData.areas.admin_area.type = await translateField(geocodeData.areas.admin_area.type, 'address part');
            }

            if (geocodeData.areas.admin_okrug) {
                translatedGeocodeData.areas.admin_okrug.name = await translateField(geocodeData.areas.admin_okrug.name, 'address part');
                translatedGeocodeData.areas.admin_okrug.type = await translateField(geocodeData.areas.admin_okrug.type, 'address part');
            }

            if (geocodeData.areas.ring_road) {
                translatedGeocodeData.areas.ring_road.name = await translateField(geocodeData.areas.ring_road.name, 'address part');
                translatedGeocodeData.areas.ring_road.short = await translateField(geocodeData.areas.ring_road.short, 'address part');
            }
        }

        // Переводим 'country'
        if (geocodeData.country) {
            translatedGeocodeData.country.name = await translateField(geocodeData.country.name, 'address part');
            translatedGeocodeData.country.sign = await translateField(geocodeData.country.sign, 'address part');
        }

        // Переводим 'cover'
        if (geocodeData.cover) {
            translatedGeocodeData.cover = await Promise.all(
                geocodeData.cover.map(async (cover) => ({
                    in: await translateField(cover.in, 'address part'),
                    out: await translateField(cover.out, 'address part'),
                })),
            );
        }

        // Переводим 'fields'
        if (geocodeData.fields) {
            translatedGeocodeData.fields = await Promise.all(
                geocodeData.fields.map(async (field) => ({
                    ...field,
                    cover: await translateField(field.cover, 'address part'),
                    name: await translateField(field.name, 'address part'),
                    type: await translateField(field.type, 'address part'),
                })),
            );
        }

        // Переводим 'stations'
        if (geocodeData.stations) {
            translatedGeocodeData.stations = await Promise.all(
                geocodeData.stations.map(async (station) => ({
                    ...station,
                    line: await translateField(station.line, 'address part'),
                    name: await translateField(station.name, 'address part'),
                    net: await translateField(station.net, 'address part'),
                    type: await translateField(station.type, 'address part'),
                })),
            );
        }

        // Переводим 'time_zone'
        if (geocodeData.time_zone) {
            translatedGeocodeData.time_zone.name = await translateField(geocodeData.time_zone.name, 'address part');
        }

        // Переводим 'post_office'
        if (geocodeData.post_office) {
            if (geocodeData.post_office.pretty) {
                const prettyParts = geocodeData.post_office.pretty.split(',').map((part) => part.trim());
                const translatedPrettyParts = await Promise.all(
                    prettyParts.map((part) => translateField(part, 'address part')),
                );
                translatedGeocodeData.post_office.pretty = translatedPrettyParts.join(', ');
            }
        }

        // Переводим поле 'pretty', разбивая по запятой
        if (geocodeData.pretty) {
            const prettyParts = geocodeData.pretty.split(',').map((part) => part.trim());
            const translatedPrettyParts = await Promise.all(
                prettyParts.map((part) => translateField(part, 'address part')),
            );
            translatedGeocodeData.pretty = translatedPrettyParts.join(', ');
        }

        return translatedGeocodeData;
    }
}
