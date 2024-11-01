import { Injectable } from '@nestjs/common';
import { ImagesRepository } from './images.repository';
import { Images, TImageHeight, TImageSize, TImageWidth } from './images.entity';
import { v4 as uuidv4 } from 'uuid';
import { FilesService } from '../files/files.service';

@Injectable()
export class ImagesService {
    constructor(
        private readonly filesService: FilesService,
        private readonly imagesRepository: ImagesRepository
    ) { }

    async processAndSaveImages(imageUrls: string[], type: 'main'| 'additional' = 'additional', hotelId: string): Promise<void> {
        const sizes: { width: TImageWidth, height: TImageHeight; name: TImageSize }[] = [
//          { width: 1024, height: 768, name: 'large' },
            { width: 828, height: 560, name: 'medium' },
//          { width: 640, height: 400, name: 'main' },
            { width: 240, height: 240, name: 'thumbnail' }
//          { width: 220, height: 220, name: 'small' },
        ];

        for (const imageUrl of imageUrls) {
            const fileExtention = imageUrl.split('/').pop().split('.')[1];
            const imagePath = await this.filesService.downloadImage(imageUrl, `images/hotels/${hotelId}`, `${uuidv4()}.${fileExtention}`);

            const resizedImagePaths = await this.filesService.resizeAndConvertImage(imagePath, sizes, `images/hotels/${hotelId}/resized`);

            for (const resizedImagePath of resizedImagePaths) {
                const image = new Images();
                image.name = resizedImagePath.split('/').pop();
                const size  = sizes.find(size => resizedImagePath.includes(`${size.width}x${size.height}`)); 
                image.size = size?.name;
                image.width = size?.width;
                image.height = size?.height;
                image.type = type; //'additional' или 'main' в зависимости от контекста
                image.hotel = { id: hotelId } as any; // Используем частичное представление объекта отеля
                image.path = resizedImagePath;
                await this.imagesRepository.save(image);
            }
        }
    }
}
