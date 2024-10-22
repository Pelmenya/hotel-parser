import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createWriteStream, promises as fsPromises, readFile } from 'fs';
import { join } from 'path';

@Injectable()
export class FilesService {
  async downloadImage(url: string, folderPath: string): Promise<string> {
    const filename = url.split('/').pop();
    if (!filename) {
      throw new Error('Некорректный URL');
    }
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    // Создаем каталог, если он не существует
    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const path = join(fullFolderPath, filename);
    const writer = createWriteStream(path);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(path));
      writer.on('error', reject);
    });
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

  async saveDataToJsonFile(data: any, filename: string, folderPath: string): Promise<void> {
    const fullFolderPath = join(__dirname, '..', 'uploads', folderPath || '');

    // Создаем каталог, если он не существует
    try {
      await fsPromises.mkdir(fullFolderPath, { recursive: true });
    } catch (error) {
      throw new Error('Ошибка при создании каталога: ' + error.message);
    }

    const filePath = join(fullFolderPath, filename);

    try {
      await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Данные успешно записаны в ${filePath}`);
    } catch (error) {
      console.error('Ошибка при записи JSON в файл:', error);
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
      // Обработка данных из JSON-файла, например:
      // console.log(jsonData);
      return jsonData;
    } catch (error) {
      console.error('Ошибка при чтении данных из JSON-файла:', error);
      return Promise.resolve('Произошла ошибка при чтении данных из JSON-файла.');
    }
  }

  async readDataPageRussianHotelsFromJson(district: string = '', page: number) {
    return this.readDataFromJsonFile(`page_${page}.json`, `pages${district ? '/districts/' + district : ''}`);
  }
}