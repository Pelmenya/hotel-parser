import { Inject, Injectable } from '@nestjs/common';
import { createWriteStream, promises as fsPromises } from 'fs';
import { join } from 'path';
import { TransportService } from '../transport/transport.service';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Observable, from, throwError, timer } from 'rxjs';
import { catchError, concatMap, retryWhen, delay, tap } from 'rxjs/operators';
import sharp from 'sharp';
import Bottleneck from 'bottleneck';
import { TSuccess } from 'src/types/t-success';

@Injectable()
export class FilesService {
  private bucketName: string;
  private maxMbps: number = 1.0; // Уменьшите скорость, чтобы протестировать
  private limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 2000, // Увеличьте минимальное время между запросами
  });

  constructor(
    private readonly transportService: TransportService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.bucketName = this.transportService.getBucket();
  }

  private downloadWithRxJS(url: string, path: string): Observable<string> {
    return new Observable<string>((observer) => {
      const axiosInstance = this.transportService.getAxiosInstance('stream');
      const maxBytesPerSecond = (this.maxMbps * 1024 * 1024) / 8;
      let downloadedBytes = 0;
      let startTime = Date.now();

      axiosInstance.get(url, { responseType: 'stream' }).then((response) => {
        const writer = createWriteStream(path);
        response.data.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          writer.write(chunk);

          const elapsedTime = (Date.now() - startTime) / 1000;
          const currentSpeed = downloadedBytes / elapsedTime;

          if (currentSpeed > maxBytesPerSecond) {
            const delayTime = ((currentSpeed - maxBytesPerSecond) / maxBytesPerSecond) * 1000;
            response.data.pause();
            setTimeout(() => response.data.resume(), delayTime);
          }
        });

        response.data.on('end', () => {
          writer.end();
          observer.next(path);
          observer.complete();
        });

        response.data.on('error', (error) => {
          this.logger.error(`Ошибка при записи файла: ${error.message}`);
          observer.error(error);
        });
      }).catch((error) => {
        observer.error(error);
      });
    });
  }

  downloadImage(url: string, folderPath: string, filename: string): Promise<string> {
    return this.limiter.schedule(() => {
      const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');
      const path = join(fullFolderPath, filename);

      return from(fsPromises.mkdir(fullFolderPath, { recursive: true })).pipe(
        concatMap(() =>
          this.downloadWithRxJS(url, path).pipe(
            retryWhen(errors => errors.pipe(
              tap(error => this.logger.error(`Ошибка при загрузке, повторная попытка: ${error.message}`)),
              delay(2000) // Увеличьте задержку между повторными попытками
            )),
            catchError(error => {
              this.logger.error(`Ошибка при загрузке файла: ${error.message}`);
              return throwError(() => error);
            })
          )
        )
      ).toPromise();
    });
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
      this.logger.error('Ошибка при загрузке файла на S3: ' + error.message);
    }
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
      this.logger.error('Ошибка при записи в файл: ' +  error.message);
    }
  }

  async saveDataToJsonFile(data: any, filename: string, folderPath: string): Promise<TSuccess> {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      this.logger.error('Ошибка при создании каталога: ' + error.message);
      return { success: false };
    }

    const filePath = join(fullFolderPath, filename);

    try {
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      this.logger.info(`Данные успешно записаны в ${filePath}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Ошибка при записи JSON в файл: ' + error.message);
      return { success: false };
    }
  }

  async readJsonFile(filename: string, folder: string): Promise<any> {
    const filePath = join(folder, filename);
    try {
      const data = await fsPromises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      this.logger.error('Ошибка при чтении или парсинге JSON:', { filePath, error });
      throw error;
    }
  }

  async readDataFromJsonFile(filename: string, folderPath: string) {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    try {
      const jsonData = await this.readJsonFile(filename, fullFolderPath);
      return jsonData;
    } catch (error) {
      this.logger.error('Ошибка при чтении данных из JSON-файла: ' + error.message );
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
        await fsPromises.rm(fullFolderPath, { recursive: true, force: true });
        this.logger.info(`Папка успешно удалена: ${folderPath}`);
      } else {
        this.logger.warn(`Папка не существует и не может быть удалена: ${folderPath}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при удалении папки ${folderPath}:`, { error });
    }
  }

  async resizeAndConvertImage(filePath: string, sizes: { width: number; height: number }[], outputFolderPath: string): Promise<string[]> {
    const convertedImagesPaths: string[] = [];
    for (const size of sizes) {
      const outputFolder = join(__dirname, '..', 'uploads', outputFolderPath, `${size.width}x${size.height}`);

      try {
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
      } catch (error) {
        this.logger.error('Ошибка при изменении размеров изображения или загрузке в S3:', { error });
      }
    }
    return convertedImagesPaths;
  }
}
