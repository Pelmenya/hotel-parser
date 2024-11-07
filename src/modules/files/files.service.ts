import { Injectable } from '@nestjs/common';
import { createWriteStream, promises as fsPromises, readFile } from 'fs';
import { join } from 'path';
import { TransportService } from '../transport/transport.service';
import sharp from 'sharp';
import { TSuccess } from 'src/types/t-success';

// Импортируйте необходимые компоненты из AWS SDK v3
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class FilesService {
  private bucketName: string;

  constructor(private readonly transportService: TransportService) {
    this.bucketName = this.transportService.getBucket();
  }

  async uploadToS3(filePath: string, key: string): Promise<void> {
    const s3Client = this.transportService.getS3Client();
    const fileContent = await fsPromises.readFile(filePath);

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
    };

    // Используйте Send метод для выполнения команды
    try {
      await s3Client.send(new PutObjectCommand(params));
      console.log(`Файл загружен на S3: ${key}`);
    } catch (error) {
      console.error('Ошибка при загрузке файла на S3:', error);
    }
  }

  async downloadImage(url: string, folderPath: string, filename: string): Promise<string> {
    if (!filename) {
      throw new Error('Некорректный URL');
    }
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const path = join(fullFolderPath, filename);
    const writer = createWriteStream(path);

    const axiosInstance = this.transportService.getAxiosInstance('stream');
    const response = await axiosInstance.get(url);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(path));
      writer.on('error', reject);
    });
  }

  async resizeAndConvertImage(filePath: string, sizes: { width: number; height: number }[], outputFolderPath: string): Promise<string[]> {
    const convertedImagesPaths: string[] = [];
    const baseOutputFolder = join(__dirname, '..', 'uploads', outputFolderPath);
    try {
      for (const size of sizes) {
        const outputFolder = join(__dirname, '..', 'uploads', outputFolderPath, `${size.width}x${size.height}`);

        await fsPromises.mkdir(outputFolder, { recursive: true });

        const outputFileName = filePath.split('/').pop().replace(/\.\w+$/, '.webp');
        const outputFilePath = join(outputFolder, outputFileName);
        convertedImagesPaths.push(outputFilePath);

        await sharp(filePath)
          .resize(size.width, size.height)
          .webp()
          .toFile(outputFilePath);

        const s3Key = join(outputFolder.slice(1), outputFileName).replace(/\\/g, '/');
        await this.uploadToS3(outputFilePath, s3Key);
        await fsPromises.unlink(outputFilePath); // Удаляем локальный файл после загрузки в S3
      }
      await fsPromises.unlink(filePath); // Удаление исходного файла после обработки
    } catch (error) {
      console.error('Ошибка при изменении размеров изображения:', error);
    }

    return convertedImagesPaths;
  }

  // Остальные методы остаются без изменений
  async saveDataToFile(data: any, filename: string, folderPath: string): Promise<void> {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const filePath = join(fullFolderPath, filename);

    try {
      await fsPromises.writeFile(filePath, data, 'utf8');
      console.log(`Данные успешно записаны в ${filePath}`);
    } catch (error) {
      console.error('Ошибка при записи в файл:', error);
    }
  }

  async saveDataToJsonFile(data: any, filename: string, folderPath: string): Promise<TSuccess> {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const filePath = join(fullFolderPath, filename);

    try {
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Данные успешно записаны в ${filePath}`);
      return { success: true };
    } catch (error) {
      console.error('Ошибка при записи JSON в файл:', error);
      return { success: false };
    }
  }

  async readJsonFile(filename: string, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = `${folder}/${filename}`;
      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(error);
          }
        }
      });
    });
  }

  async readDataFromJsonFile(filename: string, folderPath: string) {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      const jsonData = await this.readJsonFile(filename, fullFolderPath);
      return jsonData;
    } catch (error) {
      console.error('Ошибка при чтении данных из JSON-файла:', error);
      return Promise.resolve('Произошла ошибка при чтении данных из JSON-файла.');
    }
  }

  async readDataPageRussianHotelsFromJson(district: string = '', page: number) {
    return this.readDataFromJsonFile(`page_${page}.json`, `pages${district ? '/districts/' + district : ''}`);
  }

  async readDataHotelFromJson(hotelLink: string) {
    return this.readDataFromJsonFile(`page_${hotelLink}.json`, `pages/hotels/${hotelLink}`);
  }

  async deleteFile(folderPath: string, filename: string): Promise<void> {
    const filePath = join(__dirname, '..', 'uploads', folderPath, filename);
    try {
      await fsPromises.unlink(filePath);
      console.log(`Файл удален: ${filePath}`);
    } catch (error) {
      console.error(`Ошибка при удалении файла ${filePath}:`, error);
    }
  }
  
}
