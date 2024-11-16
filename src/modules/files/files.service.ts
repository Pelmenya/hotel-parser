import { Inject, Injectable } from '@nestjs/common';
import { createWriteStream, promises as fsPromises, readFile } from 'fs';
import { join } from 'path';
import { TransportService } from '../transport/transport.service';
import sharp from 'sharp';
import { TSuccess } from 'src/types/t-success';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { setDelay } from 'src/helpers/delay';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import Bottleneck from 'bottleneck';

@Injectable()
export class FilesService {
  private bucketName: string;

  private requestCount: number;
  private startTime: number | null = null;

/*   private limiter = new Bottleneck({
    reservoir: 79, // Максимум 79 запросов в минуту
    reservoirRefreshAmount: 79, // Восстановление резервуара до 79 запросов
    reservoirRefreshInterval: 60000, // Интервал восстановления - 1 минута (60,000 ms)
    minTime: 760, // Минимальное время между запросами - 760 ms (60000 ms / 79)
  });
 */  
  private limiter = new Bottleneck({
    reservoir: 54, // Максимум 54 запроса в минуту
    reservoirRefreshAmount: 54, // Восстановление резервуара до 54 запросов
    reservoirRefreshInterval: 60000, // Интервал восстановления - 1 минута (60,000 ms)
    minTime: 1125, // Минимальное время между запросами - примерно 1125 ms (1000 ms / 0.89)
  });
    
  constructor(
    private readonly transportService: TransportService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.requestCount = 0;
    this.bucketName = this.transportService.getBucket();
  }

  async uploadToS3(filePath: string, key: string): Promise<void> {
    const s3Client = this.transportService.getS3Client();
    try {
      const fileContent = await fsPromises.readFile(filePath);
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileContent,
      };

      await s3Client.send(new PutObjectCommand(params));
      this.logger.info(`Файл загружен на S3: ${key}`);
    } catch (error) {
      this.logger.error('Ошибка при загрузке файла на S3:', { error });
    }
  }

  private async fetchWithRetry(url: string, retries: number, delay: number): Promise<any> {
    try {
      const axiosInstance = this.transportService.getAxiosInstance('stream');
      return await axiosInstance.get(url);
    } catch (error) {
      if (retries > 0) {
        const elapsedTime = Date.now() - this.startTime;
        this.logger.error('Ошибка при обработке изображения:', { url, error });
        this.logger.error(`Количество успешных запросов до ошибки: ${this.requestCount}`);
        this.logger.error(`Время выполнения до ошибки: ${elapsedTime} мс`);
        this.logger.error(`Ошибка при скачивании изображения. Повтор через ${delay} мс. Осталось попыток: ${retries}`, {error});
        this.startTime = null;
        await setDelay(delay);
        return this.fetchWithRetry(url, retries - 1, delay * 2);
      } else {
        throw error;
      }
    }
  }

  async downloadImage(url: string, folderPath: string, filename: string): Promise<string> {
    if (!this.startTime) {
      this.startTime = Date.now(); // Начало отсчета времени
    }
    return this.limiter.schedule(() => this._downloadImage(url, folderPath, filename));
  }

  private async _downloadImage(url: string, folderPath: string, filename: string): Promise<string> {
    if (!filename) {
      throw new Error('Некорректный URL');
    }

    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      this.logger.error('Ошибка при создании каталога:', { error });
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const path = join(fullFolderPath, filename);
    const writer = createWriteStream(path);

    try {
      const response = await this.fetchWithRetry(url, 3, 1000);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.requestCount++; // Увеличиваем счетчик при успешной загрузке
          resolve(path);
        });
        writer.on('error', (error) => {
          this.logger.error('Ошибка при записи файла:', { error });
          reject(error);
        });
      });
    } catch (error) {
      const elapsedTime = Date.now() - this.startTime;
      this.logger.error(`Количество успешных запросов до ошибки : ${this.requestCount} за ${elapsedTime} мс`);
      this.logger.error('Ошибка при скачивании изображения:', { error });
      this.logger.error(`Количество успешных запросов до ошибки: ${this.requestCount}`);
      this.logger.error(`Время выполнения до ошибки: ${elapsedTime} мс`);
      this.startTime = null;

      try {
        await fsPromises.unlink(path);
      } catch (unlinkError) {
        this.logger.error('Ошибка при удалении частично загруженного файла:', { unlinkError });
      }
      throw new Error('Ошибка при скачивании изображения: ' + error.message);
    }
  }

  async retryOperation<T>(operation: () => Promise<T>, retries: number, delay: number): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        await setDelay(delay);
        return this.retryOperation(operation, retries - 1, delay);
      } else {
        this.logger.error('Ошибка retry operation', { error });
      }
    }
  }

  async resizeAndConvertImage(filePath: string, sizes: { width: number; height: number }[], outputFolderPath: string): Promise<string[]> {
    const convertedImagesPaths: string[] = [];
    for (const size of sizes) {
      const outputFolder = join(__dirname, '..', 'uploads', outputFolderPath, `${size.width}x${size.height}`);

      try {
        await this.retryOperation(() => fsPromises.mkdir(outputFolder, { recursive: true }), 3, 1000);
        const outputFileName = filePath.split('/').pop().replace(/\.\w+$/, '.webp');
        const outputFilePath = join(outputFolder, outputFileName);
        convertedImagesPaths.push(outputFilePath);

        await this.retryOperation(() =>
          sharp(filePath)
            .resize(size.width, size.height)
            .webp()
            .toFile(outputFilePath),
          3,
          1000
        );

        const s3Key = join(outputFolder.slice(1), outputFileName).replace(/\\/g, '/');
        await this.uploadToS3(outputFilePath, s3Key);
      } catch (error) {
        this.logger.error('Ошибка при изменении размеров изображения или загрузке в S3:', { error });
      }
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
      this.logger.info(`Данные успешно записаны в ${filePath}`);
    } catch (error) {
      this.logger.error('Ошибка при записи в файл:', { error });
    }
  }

  async saveDataToJsonFile(data: any, filename: string, folderPath: string): Promise<TSuccess> {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      this.logger.error('Ошибка при создании каталога:', { error });
      return { success: false };
    }

    const filePath = join(fullFolderPath, filename);

    try {
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      this.logger.info(`Данные успешно записаны в ${filePath}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Ошибка при записи JSON в файл:', { error });
      return { success: false };
    }
  }

  async readJsonFile(filename: string, folder: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const filePath = `${folder}/${filename}`;
      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          this.logger.error('Ошибка при чтении файла:', { filePath, err });
          reject(err);
        } else {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            this.logger.error('Ошибка при парсинге JSON:', { filePath, error });
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
      this.logger.error('Ошибка при чтении данных из JSON-файла:', { error });
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
      this.logger.info(`Файл удален: ${filePath}`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении файла ${filePath}:`, { error });
    }
  }

  async folderExists(folderPath: string): Promise<boolean> {
    try {
      await fsPromises.access(folderPath);
      return true;
    } catch {
      return false;
    }
  }

  async deleteFolder(folderPath: string): Promise<void> {
    try {
      const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

      if (await this.folderExists(fullFolderPath)) {
        await this.retryOperation(() => fsPromises.rm(fullFolderPath, { recursive: true, force: true }), 3, 1000);
        this.logger.info(`Папка успешно удалена: ${folderPath}`);
      } else {
        this.logger.warn(`Папка не существует и не может быть удалена: ${folderPath}`);
      }

    } catch (error) {
      this.logger.error(`Ошибка при удалении папки ${folderPath}:`, { error });
    }
  }

}


