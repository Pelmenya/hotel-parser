import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createWriteStream } from 'fs';
import { join } from 'path';
@Injectable()
export class FileService {
    async downloadImage(url: string): Promise<string> {
        const filename = url.split('/').pop();
        if (!filename) {
            throw new Error('Invalid URL');
        }
        const path = join(__dirname, '..', 'uploads', filename);
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
}
