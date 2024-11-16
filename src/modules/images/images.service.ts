import { Inject, Injectable } from '@nestjs/common';
import { ImagesRepository } from './images.repository';
import { Images, TImageHeight, TImageSize, TImageWidth } from './images.entity';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from '../files/files.service';
import { Hotels } from '../hotels/hotels.entity';
import path from 'path';
import { setDelay } from 'src/helpers/delay';
import { promises as fsPromises } from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ImagesService {
  private requestCount: number;
  private startTime: number;

  constructor(
    private readonly filesService: FilesService,
    private readonly imagesRepository: ImagesRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.requestCount = 0;
  }

  async processAndSaveImages(
    imageUrls: string[],
    type: 'main' | 'additional' = 'additional',
    hotel: Hotels
  ): Promise<void> {
    this.startTime = Date.now(); // Начало отсчета времени

    const sizes: { width: TImageWidth, height: TImageHeight; name: TImageSize }[] = [
      { width: 828, height: 560, name: 'medium' },
      { width: 240, height: 240, name: 'thumbnail' }
    ];
    const tempFolderPath = `images/hotels/${hotel.id}`;

    for (const imageUrl of imageUrls) {
      try {
        const originalName = imageUrl.split('/').pop().split('.')[0];
        const fileExtension = imageUrl.split('/').pop().split('.')[1];

        const imageIsExists = await this.imagesRepository.findOneByHotelIdAndOriginalName(hotel.id, originalName);
        if (!imageIsExists) {
          
          //await setDelay(80);
          
          const imagePath = await this.filesService.downloadImage(imageUrl, tempFolderPath, `${uuidv4()}.${fileExtension}`);

          if (await this.fileExists(imagePath)) {
            this.requestCount++; // Увеличиваем счетчик успешных загрузок

            const resizedImagePaths = await this.filesService.resizeAndConvertImage(imagePath, sizes, path.join(tempFolderPath, 'resized'));

            for (const resizedImagePath of resizedImagePaths) {
              try {
                const image = new Images();
                image.name = resizedImagePath.split('/').pop();
                image.original_name = originalName;
                image.original_url = imageUrl;
                const size = sizes.find(size => resizedImagePath.includes(`${size.width}x${size.height}`));
                image.size = size?.name;
                image.width = size?.width;
                image.height = size?.height;
                image.alt = hotel.name;
                image.type = type;
                image.hotel = { id: hotel.id } as Hotels;
                image.path = resizedImagePath;
                await this.imagesRepository.save(image);
              } catch (error) {
                this.logger.error('Ошибка при сохранении изображения в базе данных:', { error });
              }
            }
          }
        }
      } catch (error) {
        const elapsedTime = Date.now() - this.startTime;
        this.logger.error('Ошибка при обработке изображения:', { imageUrl, error });
        this.logger.error(`Количество успешных запросов до ошибки: ${this.requestCount}`);
        this.logger.error(`Время выполнения до ошибки: ${elapsedTime} мс`);
      }
    }

    await this.filesService.deleteFolder(tempFolderPath);
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fsPromises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
