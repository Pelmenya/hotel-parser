import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransportService, TTransportLoadContent } from '../transport/transport.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';


@Injectable()
export class ParserService {
    constructor(
        private readonly configService: ConfigService,
        private readonly transporService: TransportService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    ) { }

    async parsePage(params: any = '', type: TTransportLoadContent = 'axios', retries: number = 3) {
        this.logger.info('Parse page from url: ', params);
        const url = this.configService.get('BASE_PARSE_URL') + params;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data } = type === 'axios'
                    ? await this.transporService.getAxiosInstance().get(url)
                    : { data: await this.transporService.loadFullPageWithProxy(url) };
                return data;
            } catch (error) {
                this.logger.error(`Attempt ${attempt} - Error fetching page data:`, error.message);
                if (attempt === retries) {
                    return { error: `Failed after ${retries} attempts`, message: error.message };
                }
            }
        }
    }
}
