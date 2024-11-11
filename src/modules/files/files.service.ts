import { Injectable } from '@nestjs/common';
import { createWriteStream, promises as fsPromises, readFile } from 'fs';
import { join } from 'path';
import { TransportService } from '../transport/transport.service';
import sharp from 'sharp';
import { TSuccess } from 'src/types/t-success';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { setDelay } from 'src/helpers/delay';

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

    try {
      await s3Client.send(new PutObjectCommand(params));
      console.log(`Файл загружен на S3: ${key}`);
    } catch (error) {
      console.error('Ошибка при загрузке файла на S3:', error);
    }
  }

  private async fetchWithRetry(url: string, retries: number, delay: number): Promise<any> {
    try {
      const axiosInstance = this.transportService.getAxiosInstance('stream');
      return await axiosInstance.get(url);
    } catch (error) {
      if (retries > 0) {
        console.log(`Ошибка при скачивании изображения. Повтор через ${delay} мс. Осталось попыток: ${retries}`);
        await setDelay(delay);
        return this.fetchWithRetry(url, retries - 1, delay * 2);
      } else {
        throw error;
      }
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
      console.error('Ошибка при создании каталога:', error);
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const path = join(fullFolderPath, filename);
    const writer = createWriteStream(path);

    try {
      const response = await this.fetchWithRetry(url, 3, 1000);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(path));
        writer.on('error', (error) => {
          console.error('Ошибка при записи файла:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Ошибка при скачивании изображения:', error);
      try {
        await fsPromises.unlink(path);
      } catch (unlinkError) {
        console.error('Ошибка при удалении частично загруженного файла:', unlinkError);
      }
      throw new Error('Ошибка при скачивании изображения: ' + error.message);
    }
  }

  async resizeAndConvertImage(filePath: string, sizes: { width: number; height: number }[], outputFolderPath: string): Promise<string[]> {
    const convertedImagesPaths: string[] = [];
    try {
      for (const size of sizes) {
        const outputFolder = join(__dirname, '..', 'uploads', outputFolderPath, `${size.width}x${size.height}`);

        try {
          await fsPromises.mkdir(outputFolder, { recursive: true });
        } catch (error) {
          console.error('Ошибка при создании каталога:', error);
          continue;
        }

        const outputFileName = filePath.split('/').pop().replace(/\.\w+$/, '.webp');
        const outputFilePath = join(outputFolder, outputFileName);
        convertedImagesPaths.push(outputFilePath);

        try {
          await sharp(filePath)
            .resize(size.width, size.height)
            .webp()
            .toFile(outputFilePath);

          const s3Key = join(outputFolder.slice(1), outputFileName).replace(/\\/g, '/');
          await this.uploadToS3(outputFilePath, s3Key);
          // await fsPromises.unlink(outputFilePath);
        } catch (error) {
          console.error('Ошибка при изменении размеров изображения или загрузке в S3:', error);
          continue;
        }
      }
      // await fsPromises.unlink(filePath);
    } catch (error) {
      console.error('Ошибка при изменении размеров изображения:', error);
    }

    return convertedImagesPaths;
  }

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

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');
      await fsPromises.rm(fullFolderPath, { recursive: true, force: true });
      console.log(`Папка успешно удалена: ${folderPath}`);
    } catch (error) {
      console.error(`Ошибка при удалении папки ${folderPath}:`, error);
    }
  }
  
}
