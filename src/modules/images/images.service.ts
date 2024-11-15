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
  constructor(
    private readonly filesService: FilesService,
    private readonly imagesRepository: ImagesRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async processAndSaveImages(
    imageUrls: string[],
    type: 'main' | 'additional' = 'additional',
    hotel: Hotels
  ): Promise<void> {
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
          const imagePath = await this.filesService.downloadImage(imageUrl, tempFolderPath, `${uuidv4()}.${fileExtension}`);

          if (await this.fileExists(imagePath)) {

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
        this.logger.error('Ошибка при обработке изображения:', { imageUrl, error });
      }
    }
   
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
