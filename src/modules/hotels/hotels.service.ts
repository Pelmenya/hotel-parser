import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HotelsRepository } from './hotels.repository';
import { FilesService } from '../files/files.service';
import { DistrictsRepository } from '../districts/districts.repository';
import { Districts } from '../districts/districts.entity';
import { ParserService } from '../parser/parser.service';

import * as cheerio from 'cheerio';
import { ImagesService } from '../images/images.service';
import { replaceResolutionInUrl } from 'src/helpers/replace-resolution-in-url';
import { TAbout } from '../abouts/abouts.types';
import { OpenAIService } from '../openai/openai.service';
import { AboutsService } from '../abouts/abouts.service';
import { Hotels } from './hotels.entity';
import { AmenitiesService } from '../amenities/amenities.service';
import { TranslationService } from '../translation/translation.service';
import { filterSpaces } from 'src/helpers/filter-spaces';
import { TTranslateText } from 'src/types/t-translate-text';
import { TDistanceMeasurement, TGeoData } from '../geo/geo-data.types';
import { extractGeoCategories } from 'src/helpers/exract-geo-categories';
import { GeoService } from '../geo/geo.service';
import { TSuccess } from 'src/types/t-success';
import { PoliciesService } from '../policies/policies.service';


@Injectable()
export class HotelsService {
    private readonly logger = new Logger(HotelsService.name);
    private readonly instanceId: number;
    private readonly totalInstances: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly hotelsRepository: HotelsRepository,
        private readonly districtsRepository: DistrictsRepository,
        private readonly parserService: ParserService,
        private readonly filesService: FilesService,
        private readonly imagesService: ImagesService,
        private readonly openAIService: OpenAIService,
        private readonly aboutsService: AboutsService,
        private readonly amenitiesService: AmenitiesService,
        private readonly translationService: TranslationService,
        private readonly geoService: GeoService,
        private readonly policiesService: PoliciesService,

    ) {
        this.instanceId = this.configService.get<number>('INSTANCE_ID');
        this.totalInstances = this.configService.get<number>('TOTAL_INSTANCES');
    }

    async processAllHotels() {
        try {
            const districts = await this.districtsRepository.findAll();

            const districtsToProcess = districts.filter(d => d.count_pages > 0 && d.all_pages_loaded);

            for (const district of districtsToProcess) {
                try {
                    await this.createHotelsFromDistrictPages(district.district_link_ostrovok);
                } catch (error) {
                    this.logger.error(`Error processing hotels for district ${district.name}:`, error.stack);
                }
            }

            this.logger.log(`Processed hotels for ${districtsToProcess.length} districts.`);
        } catch (error) {
            this.logger.error('Error processing all hotels:', error.stack);
        }
    }

    async createHotelsFromDistrictPages(districtLink: string) {
        const districtData = await this.districtsRepository.findByLink(districtLink);
        if (!districtData) {
            this.logger.error(`No district found for ${districtLink}`);
            return;
        }

        const { count_pages: totalPages, processed_hotels_from_pages = [] } = districtData;
        const processedPagesNumeric = processed_hotels_from_pages.map(Number);

        const pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => !processedPagesNumeric.includes(page)
            );

        if (pagesToProcess.length === 0) {
            this.logger.log(`All pages for district ${districtLink} are already processed.`);
            return;
        }

        for (const page of pagesToProcess) {
            try {
                const success = await this.extractAndStoreHotelsFromDistrictPage(districtData, page);
                if (success) {
                    // Обновляем массив только после успешной обработки страницы
                    const updatedProcessedPages = [...processedPagesNumeric, page];
                    await this.districtsRepository.updateProcessedHotelsFromPages(districtData.id, updatedProcessedPages);
                    processedPagesNumeric.push(page); // Локально обновляем массив для последующих итераций
                }
            } catch (error) {
                this.logger.error(`Error processing page ${page} of district ${districtLink}:`, error.stack);
            }
        }
    }

    private async extractAndStoreHotelsFromDistrictPage(district: Districts, page: number): Promise<boolean> {
        try {
            const data = await this.filesService.readDataPageRussianHotelsFromJson(district.district_link_ostrovok.split('/')[3], page);
            const $ = cheerio.load(data);

            const pagePromises = $('.HotelCard_mainInfo__pNKYU').map(async (index, element) => {
                const hotel_link_ostrovok = $(element).find('.HotelCard_title__cpfvk').children('a').attr('href') || '';
                const name = $(element).find('.HotelCard_title__cpfvk').attr('title').trim() || '';
                const address = $(element).find('.HotelCard_address__AvnV2').text()?.trim() || '';
                const locations_from = [];
                $(element).children('.HotelCard_distances__pVfDQ').map((i, el) => {
                    const distance_from = $(el).text();
                    locations_from.push(distance_from);
                });
                const stars = $(element).find('.Stars_stars__OMmzT').children('.Stars_star__jwPss').length || 0;

                const hotelData = {
                    name,
                    address,
                    hotel_link_ostrovok,
                    locations_from,
                    stars,
                    district, // Добавляем район к данным отеля
                };

                const createdHotel = await this.hotelsRepository.createIfNotExists(hotelData);
                if (createdHotel) {
                    this.logger.log(`Hotel created: ${createdHotel.name}, ${createdHotel.address}`);
                } else {
                    this.logger.log(`Hotel already exists: ${name}, ${address}`);
                }
            }).get();

            await Promise.all(pagePromises);
            return true; // Успешная обработка страницы
        } catch (error) {
            this.logger.error(`Error processing page ${page}:`, error.stack);
            return false; // Неуспешная обработка страницы
        }
    }

    async getRussianHotelsByPageAndDistrict(district: string, page: number) {
        return await this.filesService.readDataPageRussianHotelsFromJson(district, page);
    }

    async saveHotelPage(hotelId: string, hotelLink: string) {
        const linkPaths = hotelLink.split('/');
        linkPaths.splice(0, 3);
        const data = await this.parserService.parsePage(`/${linkPaths.join('/')}`);
        if (data.error) {
            this.logger.error(`Failed to get data for page of hotel ${hotelLink}:`, data.message);
        }
        const { success } = await this.filesService.saveDataToJsonFile(data, `page_${hotelLink.split('/')[5]}.json`, `pages/hotels/${hotelLink.split('/')[5]}`);
        if (success) {
            await this.hotelsRepository.updateHotelPageLoaded(hotelId, true);
        }
        return data;
    }

    async saveHotelsPages(batchSize: number) {
        this.logger.log(`Instance ${this.instanceId} is starting to process hotel pages.`);

        const hotelsToProcess = await this.hotelsRepository.lockHotelsForProcessing(this.instanceId, batchSize);

        if (hotelsToProcess.length === 0) {
            this.logger.log(`No more hotel pages to load.`);
            return;
        }

        for (const hotel of hotelsToProcess) {
            try {
                await this.saveHotelPage(hotel.id, hotel.hotel_link_ostrovok);
                await this.extractAndStoreHotelFromPage(hotel.id);

                // Снимаем блокировку и отмечаем страницу как загруженную после успешной обработки
                await this.hotelsRepository.unlockHotel(hotel.id);
                await this.hotelsRepository.updateHotelPageLoaded(hotel.id, true);
            } catch (error) {
                this.logger.error(`Error processing hotel with ID ${hotel.id}:`, error.stack);

                // Снимаем блокировку в случае ошибки, чтобы запись могла быть обработана позже
                await this.hotelsRepository.unlockHotel(hotel.id);
            }
        }

        this.logger.log(`Instance ${this.instanceId} processed ${hotelsToProcess.length} hotel pages.`);
    }

    async getDataHotelFromJson(hotelLink: string) {
        return this.filesService.readDataHotelFromJson(hotelLink);
    }

    async extractAndStoreHotelFromPage(id: string) {
        const hotels = await this.hotelsRepository.findHotelsWithSavePageById(id);
        if (hotels.length) {
            const hotel = hotels[0];
            const hotelLinkPart = hotel.hotel_link_ostrovok.split('/')[5];
            const data = await this.getDataHotelFromJson(hotelLinkPart);
            const $ = cheerio.load(data);

            hotel.name = $('.HotelHeader_name__hWIU0').text().trim();
            hotel.address_page = $('.GeoBlock_address__mcch3').text().trim();

            const ratingText = $('.TotalRating_content__k5u6S').first().text().trim();
            const rating = ratingText ? parseFloat(ratingText.replace(',', '.')) : -1;
            hotel.rating = !isNaN(rating) ? rating : -1;

            const promises = [
                this.createHotelAboutFromPage($, hotel),
                this.createHotelImagesFromPage($, hotel),
                this.createHotelAmenitiesFromPage($, hotel),
                this.createHotelGeoFromPage($, hotel),
                this.createHotelPoliciesFromPage($, hotel)
            ];

            try {

                const results = await Promise.all(promises);

                hotel.abouts_processed = results[0].success;
                hotel.images_processed = results[1].success;
                hotel.amenities_processed = results[2].success;
                hotel.geo_processed = results[3].success;
                hotel.policies_processed = results[4].success;

                this.logger.warn('All parts are processed');
            } catch (error) {
                this.logger.error(`Error processing hotel ${hotel.id}:`, error);
            }

            hotel.page_processed = hotel.abouts_processed &&
                hotel.images_processed &&
                hotel.amenities_processed &&
                hotel.geo_processed &&
                hotel.policies_processed;

            await this.hotelsRepository.save(hotel);

            if (hotel.page_processed) {
                await this.filesService.deleteFile(`pages/hotels/${hotelLinkPart}`, `page_${hotelLinkPart}.json`);
            }

            return { hotel };
        }
    }

    async createHotelAboutFromPage(data: cheerio.Root, hotel: Hotels): Promise<TSuccess> {
        const $ = data;
        const aboutHotelDescriptionTitle = $('.About_about__Q75t5').children('.About_title__Jtfdw').text().trim() || '';
        const aboutHotelDescriptions = [];

        if (aboutHotelDescriptionTitle || $('.About_description__KONG6').length) {
            $('.About_description__KONG6').each((idx, el) => {
                const title = $(el).children('.About_descriptionTitle__0r__H').text().trim();
                const paragraph = $(el).children('.About_descriptionParagraph__PNiNl').text().trim();
                if (title && paragraph) {
                    aboutHotelDescriptions.push({ idx, title, paragraph });
                }
            });

            const dataDescription: TAbout = { aboutHotelDescriptionTitle, aboutHotelDescriptions };
            const openAIData = await this.openAIService.generate(dataDescription);
            const res = await this.aboutsService.saveOpenAIData(openAIData, hotel.id);
            return { success: res.success };
        }

        return { success: true }; // Возвращаем true, если данных нет, чтобы отметить как обработанное
    }

    async createHotelImagesFromPage(data: cheerio.Root, hotel: Hotels): Promise<TSuccess> {
        const $ = data;
        const mainImageUrl = replaceResolutionInUrl($('.ScrollGallery_slide__My3l7').first().find('img').attr('src') || '', '1024x768');
        const additionalImageUrls: string[] = $('.ScrollGallery_slide__My3l7').map((idx, el) => {
            if (idx !== 0) return replaceResolutionInUrl($(el).find('img').attr('src') || '', '1024x768');
        }).get().filter(Boolean);

        if (mainImageUrl) {
            await this.imagesService.processAndSaveImages([mainImageUrl], 'main', hotel);
        }

        if (additionalImageUrls.length > 0) {
            await this.imagesService.processAndSaveImages(additionalImageUrls, 'additional', hotel);
        }

        return { success: true }; // Отмечаем как обработанное, даже если изображений нет
    }

    async createHotelAmenitiesFromPage(data: cheerio.Root, hotel: Hotels): Promise<TSuccess> {
        const $ = data;
        const mainAmenitiesTitle = filterSpaces($('.Perks_amenities__RC9_b').children('.Perks_title__I_8U1').text().trim() || '');
        if (mainAmenitiesTitle) {
            const mainAmenitiesTitleEn = await this.translationService.translateText('amenity title', mainAmenitiesTitle, 'en');

            const mainTitles: TTranslateText = { original: mainAmenitiesTitle, translated: mainAmenitiesTitleEn };
            const mainAmenitiesElements = $('.Perks_amenity__juSfj');
            const mainAmenities = await Promise.all(
                mainAmenitiesElements.map(async (idx, el) => {
                    const amenityText = filterSpaces($(el).text().trim());
                    if (amenityText) {
                        const translatedText = await this.translationService.translateText('amenity', amenityText, 'en');
                        return { idx, original: amenityText, translated: translatedText };
                    }
                    return null;
                }).get().filter(Boolean)
            );

            await this.amenitiesService.saveAmenities(hotel.id, mainTitles, mainAmenities as Array<TTranslateText & { idx: number, paid?: boolean }>, 'main');

            $('.Amenities_group__X5Qd7').each(async (_, group) => {
                const additionalAmenitiesTitle = filterSpaces($(group).children('.Amenities_groupTitle__aDVIi').text().trim() || '');
                if (additionalAmenitiesTitle) {
                    const additionalAmenitiesTitleEn = await this.translationService.translateText('amenity title', additionalAmenitiesTitle, 'en');

                    const additionalTitles: TTranslateText = { original: additionalAmenitiesTitle, translated: additionalAmenitiesTitleEn };
                    const additionalElements = $(group).find('li');
                    const additionalAmenities = await Promise.all(
                        additionalElements.map(async (idx, amenity) => {
                            const amenityText = filterSpaces($(amenity).children('.Amenities_amenityName__a_l1_').text().trim());
                            const paid = $(amenity).children('.Amenities_chargeable__mq3_I').text().trim() ? true : false;
                            if (amenityText) {
                                const translatedText = await this.translationService.translateText('amenity', amenityText, 'en');
                                return { idx, original: amenityText, translated: translatedText, paid };
                            }
                            return null;
                        }).get().filter(Boolean)
                    );
                    await this.amenitiesService.saveAmenities(hotel.id, additionalTitles, additionalAmenities as Array<TTranslateText & { idx: number, paid?: boolean }>, 'additional');
                }
            });
        }

        return { success: true }; // Всегда возвращаем true, чтобы отметить как обработанное
    }

    async createHotelGeoFromPage(data: cheerio.Root, hotel: Hotels): Promise<TSuccess> {
        const $ = data;
        const mainGeoTitle = filterSpaces($('.Perks_geoblock__GayIf').children('.Perks_title__I_8U1').text().trim() || '');
        if (mainGeoTitle) {
            const mainGeoTitleEn = await this.translationService.translateText('geo title', mainGeoTitle, 'en');

            const mainTitles: TTranslateText = { original: mainGeoTitle, translated: mainGeoTitleEn };
            const mainGeoElements = $('.Perks_poi__FKQEN');
            const mainGeo = await Promise.all(
                mainGeoElements.map(async (idx, geo) => {
                    const geoCategory = extractGeoCategories($, geo)[0];
                    const geoName = filterSpaces($(geo).text().trim().split('•')[0]);
                    const geoFromHotel = Number(filterSpaces($(geo).text().trim().split('•')[1].split(' ')[0]));
                    const measurement: TDistanceMeasurement = filterSpaces($(geo).text().trim().split('•')[1].split(' ')[1].trim()) === 'км' ? 'км' : 'м';

                    if (geoName) {
                        const translatedText = await this.translationService.translateText('geo object', geoName, 'en');
                        return { idx, original: geoName, translated: translatedText, category: geoCategory, measurement, distance_from_hotel: geoFromHotel };
                    }
                    return null;
                }).get().filter(Boolean)
            );

            await this.geoService.saveGeoData(hotel.id, mainTitles, mainGeo as Array<TTranslateText & Partial<TGeoData>>, 'main');

            $('.Pois_list__pY8i4').each(async (_, group) => {
                const subtitles = $(group).find('.Pois_subtitle__rL6_Z');
                const elementsLi = $(group).find('li');

                subtitles.each(async (subtitleIdx, subtitle) => {
                    const additionalGeoTitle = filterSpaces($(subtitle).text().trim() || '');
                    if (additionalGeoTitle) {
                        const additionalGeoTitleEn = await this.translationService.translateText('geo title', additionalGeoTitle, 'en');

                        const additionalTitles: TTranslateText = { original: additionalGeoTitle, translated: additionalGeoTitleEn };
                        const startIdx = $(subtitle).parent().index() + 1;
                        const endIdx = subtitleIdx < subtitles.length - 1 ? $(subtitles[subtitleIdx + 1]).parent().index() : elementsLi.length;

                        const additionalElements = elementsLi.slice(startIdx, endIdx);
                        const additionalGeo = await Promise.all(
                            additionalElements.map(async (idx, geo) => {
                                const geoDiv = $(geo).children('div');
                                const geoCategory = extractGeoCategories($, geoDiv.get(0))[0];

                                const geoName = filterSpaces(geoDiv.text().trim().split('•')[0]);
                                const geoFromHotel = Number(filterSpaces(geoDiv.text().trim().split('•')[1].split(' ')[0]));
                                const measurement: TDistanceMeasurement = filterSpaces(geoDiv.text().trim().split('•')[1].split(' ')[1].trim()) === 'км' ? 'км' : 'м';

                                if (geoName) {
                                    const translatedText = await this.translationService.translateText('geo object', geoName, 'en');
                                    return { idx, original: geoName, translated: translatedText, category: geoCategory, measurement, distance_from_hotel: geoFromHotel };
                                }
                                return null;
                            }).get().filter(Boolean)
                        );

                        await this.geoService.saveGeoData(hotel.id, additionalTitles, additionalGeo as Array<TTranslateText & Partial<TGeoData>>, 'additional');
                    }
                });
            });
        }

        return { success: true }; // Отмечаем как обработанное, даже если данных нет
    }

    async createHotelPoliciesFromPage(data: cheerio.Root, hotel: Hotels): Promise<TSuccess> {
        const $ = data;
        const settlementConditions = $('.Section_wrapper__TMdj2').first();
        const title = $(settlementConditions).children('.Section_title__2sPUE').text().trim() || '';

        if (title === 'Условия заселения') {
            const titleEn = await this.translationService.translateText('policy title', title, 'en');
            const titles: TTranslateText = { original: title, translated: titleEn };

            const policyName = $(settlementConditions).find('.PolicyBlock_title__EmLuh').first().text().trim();
            const policyNameEn = await this.translationService.translateText('policy name', policyName, 'en');

            const checkIn = $(settlementConditions).find('.PolicyBlock_policyTableCell_checkInCheckOut___KsAn').first().text().trim();
            const checkInEn = await this.translationService.translateText('policy text', checkIn, 'en');

            const checkOut = $(settlementConditions).find('.PolicyBlock_policyTableCell_checkInCheckOut___KsAn').last().text().trim();
            const checkOutEn = await this.translationService.translateText('policy text', checkOut, 'en');

            if (policyName && checkIn && checkOut) {
                return await this.policiesService.savePolicies(
                    hotel.id,
                    titles,
                    [
                        { idx: 0, name: policyName, in: checkIn, out: checkOut },
                        { idx: 1, name: policyNameEn, in: checkInEn, out: checkOutEn },
                    ]
                );
            }
        }

        return { success: true }; // Возвращаем true, если данных нет, чтобы отметить как обработанное
    }
}


