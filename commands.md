### Запуск с одним сервером 
``` bash
docker compose -f docker-compose.dev.yml up --build
```

### Запуск всех instance hotel parser
``` bash
docker compose up --build
```
### Dump BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres hotels" > ./dump/dump_25_12_24_prod.sql
```

### Restore BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres hotels" < ./dump/dump_24_12_24.sql
```

### Dump Table
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres --dbname=hotels_backup --table=public.locations --data-only --no-owner --no-privileges" > ./dump/locations_backup.sql
```

# Удаляем данные из таблицы locations
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres --dbname=hotels -c 'DELETE FROM public.locations'"
```

# Импортируем данные из файла
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres --dbname=hotels" < ./dump/locations_backup.sql
```



Управление МиграциямиВам нужно будет использовать Docker для выполнения миграций, так как ваше приложение работает внутри контейнера. Вот как это можно сделать:
Создание новой миграции:
Чтобы создать новую пустую миграцию, используйте команду:bashdocker-compose exec hotel-parser-1 npm run migration:create -- <MigrationName>

Замените <MigrationName> на имя вашей миграции, например, InitialSetup.


Генерация миграции на основе изменений в сущностях:
Если вы внесли изменения в ваши сущности и хотите сгенерировать миграцию автоматически:
bashdocker-compose exec hotel-parser-1 npm run migration:generate -- <MigrationName>

Это создаст файл миграции, который будет содержать SQL-команды для внесения необходимых изменений в базу данных.


Запуск миграций:
Чтобы применить все ваши миграции к базе данных, выполните следующую команду:
bashdocker-compose exec hotel-parser-1 npm run migration:run

Эта команда выполнит все миграции, которые еще не были применены.


Откат миграции:
Если вам нужно откатить последнюю примененную миграцию, используйте:
bashdocker-compose exec hotel-parser-1 npm run migration:revert

Это отменит изменения, внесенные последней миграцией.


Дополнительные Шаги


Проверка логов: После выполнения команд вы можете проверить логи контейнера, чтобы убедиться, что все прошло успешно и без ошибок.


Обновление миграций: Если у вас есть изменения в сущностях после создания миграции, не забудьте сгенерировать новую миграцию и повторно применить её.


Совместная работа: Если вы работаете в команде, не забудьте синхронизировать ваши миграции с другими разработчиками, чтобы избежать конфликтов.


Эти шаги помогут вам эффективно управлять миграциями в вашем проекте, используя Docker и TypeORM. Это позволит вам поддерживать консистентность базы данных и её схемы во время разработки и внедрения новых функций.




Для использования Yandex Translate API в целях перевода текста, включая транслитерацию между языками, вам нужно выполнить несколько шагов. Вот пошаговая инструкция, как это сделать в приложении на Node.js:1. Регистрация и получение API-ключа
Зарегистрируйтесь или войдите в свою учётную запись на Яндекс.Облако.
Создайте новый проект в консоли управления.
Активируйте API Яндекс.Переводчика в разделе "Каталог сервисов".
Создайте сервисный аккаунт и выдайте ему необходимые права для использования Translate API.
Создайте IAM-токен для аутентификации запросов к API.
2. Установка необходимых пакетовДля работы с HTTP-запросами в Node.js часто используется библиотека axios. Установите её, если ещё не установили:bashnpm install axios

3. Реализация запроса к Yandex Translate API
Создайте скрипт, который будет отправлять запрос на сервер Яндекса для перевода текста.
javascriptconst axios = require('axios');

const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(
      'https://translate.api.cloud.yandex.net/translate/v2/translate',
      {
        folderId: 'YOUR_FOLDER_ID',
        texts: [text],
        targetLanguageCode: targetLang,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer YOUR_IAM_TOKEN`,
        },
      }
    );

    const translatedText = response.data.translations[0].text;
    return translatedText;
  } catch (error) {
    console.error('Ошибка при переводе:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const main = async () => {
  const text = "ul. Sovetskaja 48, Bakchar";
  const translatedText = await translateText(text, 'ru');
  console.log('Переведённый текст:', translatedText);
};

main();

4. Замените значения

YOUR_FOLDER_ID: замените на идентификатор вашего каталога в Яндекс.Облаке.
YOUR_IAM_TOKEN: замените на ваш IAM-токен, который вы создали ранее.

5. Запуск скрипта
Запустите скрипт с помощью Node.js:
bashnode ваш_скрипт.js

Примечания

Ограничения и стоимость: Убедитесь, что вы ознакомлены с лимитами бесплатного использования и стоимостью платных запросов, если они превышают бесплатный лимит.
Безопасность: Никогда не храните IAM-токен и другие чувствительные данные в исходном коде, если публикуете его. Используйте переменные окружения или безопасные хранилища для конфиденциальной информации.
предлагается автоматизация 

var jose = require('node-jose');
var fs = require('fs');

var json = JSON.parse(fs.readFileSync(require.resolve('<JSON-файл_c_ключами>')));

var key = json.private_key;
var serviceAccountId = json.service_account_id;
var keyId = json.id;

var now = Math.floor(new Date().getTime() / 1000);

var payload = {
   aud: "https://iam.api.cloud.yandex.net/iam/v1/tokens",
   iss: serviceAccountId,
   iat: now,
   exp: now + 3600
};

jose.JWK.asKey(key, 'pem', { kid: keyId, alg: 'PS256' })
   .then(function (result) {
      jose.JWS.createSign({ format: 'compact' }, result)
         .update(JSON.stringify(payload))
         .final()
         .then(function (result) {
            console.log(result);
         });
   });
что должно быть '<JSON-файл_c_ключами>ChatGPTgpt-4o-15 736 CAPSВ вашем коде под '<JSON-файл_c_ключами>' подразумевается путь к JSON-файлу, который содержит необходимые ключи и идентификаторы для аутентификации с использованием Yandex.Cloud. Этот файл должен содержать следующие ключевые поля:
private_key: приватный ключ вашего сервисного аккаунта, который используется для подписывания JWT-токена.
service_account_id: идентификатор вашего сервисного аккаунта в Яндекс.Облаке.
id: идентификатор ключа, который вы используете для подписи.
Пример структуры JSON-файла:json{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIBV...your_private_key...\n-----END PRIVATE KEY-----",
  "service_account_id": "your_service_account_id",
  "id": "your_key_id"
}

Пояснение:

private_key: Здесь должен быть ваш приватный ключ в формате PEM. Этот ключ используется для подписи JWT.
service_account_id: Уникальный идентификатор вашего сервисного аккаунта.
id: Уникальный идентификатор ключа, связанного с вашим сервисным аккаунтом.

Как получить JSON-файл:

Создайте сервисный аккаунт в Яндекс.Облаке.
Создайте ключ доступа для этого аккаунта.
Сохраните ключ в формате JSON, который будет содержать необходимые поля.

Замечания:

Безопасность: Убедитесь, что файл с ключами не доступен публично и хранится в безопасном месте.
Время жизни токена: В поле exp задаётся время жизни токена (в данном случае 3600 секунд или 1 час). Подумайте о необходимости обновления токена по истечении этого времени.

Если у вас возникнут сложности с получением ключей или настройкой сервиса, обратитесь к документации Яндекс.Облака или службе поддержки. Если вам не удаётся решить проблему с URL-анализом, попробуйте отключить функцию анализа URL в настройках чата.Пункт 2, какой создать ключ статический ключ доступа, api-ключ bkb авторизованный ключ?ChatGPTgpt-4o-16 976 CAPSДля работы с Yandex.Cloud и генерации IAM-токенов с использованием JWT необходимо создать авторизованный ключ. Это ключ, который используется для аутентификации от имени сервисного аккаунта, и именно он позволяет подписывать JWT для получения IAM-токена.Вот шаги для создания такого ключа:Шаги для создания авторизованного ключа в Yandex.Cloud
Создайте сервисный аккаунт:

Перейдите в панель управления Yandex.Cloud.
В разделе "Управление доступом" выберите "Сервисные аккаунты".
Нажмите "Создать сервисный аккаунт" и следуйте инструкциям.



Создайте авторизованный ключ для сервисного аккаунта:

Перейдите в созданный сервисный аккаунт.
В разделе "Ключи" выберите "Создать новый ключ".
Выберите "Авторизованный ключ".
Сохраните полученный JSON-файл с ключами на ваш компьютер. Этот файл будет содержать private_key, service_account_id и id, которые используются для подписывания JWT и получения IAM-токенов.


Использование авторизованного ключаJSON-файл, который вы скачаете, будет содержать всю необходимую информацию. Убедитесь, что вы храните этот файл в безопасном месте, так как он содержит чувствительную информацию.Примечания:
Безопасность: Никогда не делитесь вашим приватным ключом и JSON-файлом публично и не загружайте его в публичные репозитории.
Права доступа: Убедитесь, что сервисный аккаунт имеет необходимые права для доступа к ресурсам, с которыми вы планируете работать.
Документация: Если у вас возникнут трудности, обратитесь к документации Yandex.Cloud по управлению доступом для получения дополнительной информации.
Следуя этим шагам, вы сможете успешно создать авторизованный ключ и использовать его для аутентификации в Yandex.Cloud.получил сохранил в корне проекта hotel_parser. Напиши теперь сервис для переводов в Nest.js использую информацию вышеChatGPTgpt-4o-21 470 CAPSДля создания сервиса в Nest.js, который будет использовать Yandex Translate API с применением JWT для аутентификации, нужно следовать этим шагам. Предположим, что JSON-файл с ключом сохранён в корне вашего проекта и называется, например, key.json. Вот как можно реализовать сервис:1. Установка необходимых пакетовУстановите axios для HTTP-запросов и node-jose для работы с JWT:bashnpm install axios node-jose

2. Создание перевода сервиса
Создайте файл translation.service.ts в вашем Nest.js проекте:
typescriptimport { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';

@Injectable()
export class TranslationService {
  private readonly iamTokenUrl = 'https://iam.api.cloud.yandex.net/iam/v1/tokens';
  private readonly translateApiUrl = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
  private readonly keyFilePath = './key.json'; // Путь к вашему JSON-файлу

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.keyFilePath, 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
    const payload = {
      aud: this.iamTokenUrl,
      iss: service_account_id,
      iat: now,
      exp: now + 3600,
    };

    const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
    const jws = await jose.JWS.createSign({ format: 'compact' }, key)
      .update(JSON.stringify(payload))
      .final();

    const response = await axios.post(this.iamTokenUrl, {
      jwt: jws,
    });

    return response.data.iamToken;
  }

  public async translateText(text: string, targetLang: string): Promise<string> {
    const iamToken = await this.getIamToken();

    const response = await axios.post(
      this.translateApiUrl,
      {
        folderId: 'YOUR_FOLDER_ID', // Замените на ваш идентификатор каталога
        texts: [text],
        targetLanguageCode: targetLang,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${iamToken}`,
        },
      },
    );

    return response.data.translations[0].text;
  }
}

3. Создание контроллера
Создайте контроллер для работы с переводами:
typescriptimport { Controller, Get, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async translate(@Query('text') text: string, @Query('lang') lang: string): Promise<string> {
    return this.translationService.translateText(text, lang);
  }
}

4. Обновление модуля
Обновите ваш основной модуль для использования сервиса и контроллера:
typescriptimport { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';

@Module({
  controllers: [TranslationController],
  providers: [TranslationService],
})
export class AppModule {}

5. Запуск приложения
После настройки сервиса, контроллера и модуля вы можете запустить ваше Nest.js приложение:
bashnpm run start

Теперь вы можете делать GET-запросы к вашему приложению для перевода текста, например:
textGET http://localhost:3000/translate?text=Hello&lang=ru

Примечания

Переменные окружения: Рекомендуется хранить такие данные, как folderId, в переменных окружения для повышения безопасности.
Обработка ошибок: Добавьте обработку ошибок в TranslationService для более надёжного выполнения.
Безопасность: Убедитесь, что ваш JSON-файл с ключами хранится безопасно и защищён от несанкционированного доступа.
сохрани YOUR_FOLDER_ID в.env и используй configService
для его извлечения

app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './modules/postgres/postgres.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParserModule } from './modules/parser/parser.module';
import { CountryModule } from './modules/countries/countries.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { FilesModule } from './modules/files/files.module';
import { DistrictsModule } from './modules/districts/districts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Сделать конфигурацию глобальной (необязательно, но полезно)
    }),
    PostgresModule,
    ParserModule,
    CountryModule,
    HotelsModule,
    FilesModule,
    DistrictsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 
И где взять YOUR_FOLDER_IDChatGPTgpt-4o-23 701 CAPSДля использования переменных окружения в Nest.js с помощью ConfigModule и извлечения значений через ConfigService, вам нужно выполнить следующие шаги. Также я объясню, как найти YOUR_FOLDER_ID для Yandex.Cloud.Шаги по настройке переменных окружения
Создайте файл .env в корне вашего проекта:
plaintextYOUR_FOLDER_ID=ваш_идентификатор_каталога

Здесь ваш_идентификатор_каталога — это folderId вашего проекта в Yandex.Cloud.


Настройка ConfigModule в Nest.js
Вы уже добавили ConfigModule в свой app.module.ts. Убедитесь, что он импортируется и используется глобально, как показано в вашем коде:
typescriptimport { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// Ваши другие импорты

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Ваши другие модули
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}



Использование ConfigService в вашем сервисе
Обновите ваш translation.service.ts для использования ConfigService:
typescriptimport { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';

@Injectable()
export class TranslationService {
  private readonly iamTokenUrl = 'https://iam.api.cloud.yandex.net/iam/v1/tokens';
  private readonly translateApiUrl = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
  private readonly keyFilePath = './key.json'; // Путь к вашему JSON-файлу

  constructor(private readonly configService: ConfigService) {}

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.keyFilePath, 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
    const payload = {
      aud: this.iamTokenUrl,
      iss: service_account_id,
      iat: now,
      exp: now + 3600,
    };

    const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
    const jws = await jose.JWS.createSign({ format: 'compact' }, key)
      .update(JSON.stringify(payload))
      .final();

    const response = await axios.post(this.iamTokenUrl, {
      jwt: jws,
    });

    return response.data.iamToken;
  }

  public async translateText(text: string, targetLang: string): Promise<string> {
    const iamToken = await this.getIamToken();
    const folderId = this.configService.get<string>('YOUR_FOLDER_ID');

    const response = await axios.post(
      this.translateApiUrl,
      {
        folderId,
        texts: [text],
        targetLanguageCode: targetLang,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${iamToken}`,
        },
      },
    );

    return response.data.translations[0].text;
  }
}



Где взять YOUR_FOLDER_ID

Перейдите в консоль управления Yandex.Cloud.
Выберите проект, с которым вы работаете.
Найдите идентификатор каталога (Folder ID) в разделе "Каталоги и проекты" или "Идентификаторы ресурсов". Он будет отображаться в виде строки из цифр и букв.

Этот идентификатор вам нужен для указания в .env файле, чтобы сервис мог корректно взаимодействовать с ресурсами Yandex.Cloud. Если у вас возникли трудности с нахождением Folder ID, обратитесь к разделу справки в Yandex.Cloud или к поддержке.как учесть ограничения Вызовов одного метода API в секунду	20;
Символов, отправленных на перевод или определение языка, в час	1 млнChatGPTgpt-4o-26 893 CAPSПри работе с API, такими как Yandex Translate API, важно учитывать ограничения на количество запросов и символов, чтобы избежать превышения лимитов и возможных ошибок. Вот несколько подходов, которые помогут вам управлять вызовами API и контролировать их использование:1. Лимитирование запросовИспользование "rate limiting" библиотекиВ Node.js можно использовать специализированные библиотеки, такие как bottleneck, для управления частотой вызовов API. Вот пример, как это можно реализовать с помощью bottleneck:
Установите библиотеку:
bashnpm install bottleneck



Используйте её в вашем сервисе:
typescriptimport { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';
import Bottleneck from 'bottleneck';

@Injectable()
export class TranslationService {
  private readonly iamTokenUrl = 'https://iam.api.cloud.yandex.net/iam/v1/tokens';
  private readonly translateApiUrl = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
  private readonly keyFilePath = './key.json';

  private limiter = new Bottleneck({
    reservoir: 20, // Вызовов в секунду
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 1000, // 1 секунда
  });

  constructor(private readonly configService: ConfigService) {}

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.keyFilePath, 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
    const payload = {
      aud: this.iamTokenUrl,
      iss: service_account_id,
      iat: now,
      exp: now + 3600,
    };

    const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
    const jws = await jose.JWS.createSign({ format: 'compact' }, key)
      .update(JSON.stringify(payload))
      .final();

    const response = await axios.post(this.iamTokenUrl, {
      jwt: jws,
    });

    return response.data.iamToken;
  }

  public async translateText(text: string, targetLang: string): Promise<string> {
    return this.limiter.schedule(async () => {
      const iamToken = await this.getIamToken();
      const folderId = this.configService.get<string>('YOUR_FOLDER_ID');

      const response = await axios.post(
        this.translateApiUrl,
        {
          folderId,
          texts: [text],
          targetLanguageCode: targetLang,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${iamToken}`,
          },
        },
      );

      return response.data.translations[0].text;
    });
  }
}



2. Контроль символов
Для контроля количества символов можно создать счётчик символов, отправленных за последний час, и сбрасывать его каждый час.
Пример контроля символов:


Создайте переменные для отслеживания символов:
typescriptprivate symbolsUsed = 0;
private lastReset = Date.now();



Добавьте логику контроля символов:
typescriptprivate resetSymbolsCounter() {
  const now = Date.now();
  if (now - this.lastReset >= 3600000) { // 3600000 мс = 1 час
    this.symbolsUsed = 0;
    this.lastReset = now;
  }
}

public async translateText(text: string, targetLang: string): Promise<string> {
  this.resetSymbolsCounter();

  if (this.symbolsUsed + text.length > 1_000_000) {
    throw new Error('Превышен лимит символов в час');
  }

  return this.limiter.schedule(async () => {
    const iamToken = await this.getIamToken();
    const folderId = this.configService.get<string>('YOUR_FOLDER_ID');

    const response = await axios.post(
      this.translateApiUrl,
      {
        folderId,
        texts: [text],
        targetLanguageCode: targetLang,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${iamToken}`,
        },
      },
    );

    this.symbolsUsed += text.length;

    return response.data.translations[0].text;
  });
}



С помощью этих подходов вы сможете контролировать частоту вызовов и количество отправляемых символов, чтобы соответствовать ограничениям API.Напиши весь код сервиса убери private readonly iamTokenUrl = 'https://iam.api.cloud.yandex.net/iam/v1/tokens';
  private readonly translateApiUrl = 'https://translate.api.cloud.yandex.net/translate/v2/translate';
  private readonly keyFilePath = './key.json'; в .env ChatGPTgpt-4o-30 408 CAPSДавайте создадим сервис для перевода текста с использованием Yandex Translate API в приложении на Nest.js. Мы будем хранить все конфигурационные параметры в файле .env и извлекать их с помощью ConfigService.Файл .envСоздайте файл .env в корне вашего проекта и добавьте туда следующие строки:plaintextIAM_TOKEN_URL=https://iam.api.cloud.yandex.net/iam/v1/tokens
TRANSLATE_API_URL=https://translate.api.cloud.yandex.net/translate/v2/translate
KEY_FILE_PATH=./key.json
YOUR_FOLDER_ID=ваш_идентификатор_каталога

Сервис translation.service.ts
Создайте или обновите translation.service.ts:
typescriptimport { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';
import Bottleneck from 'bottleneck';

@Injectable()
export class TranslationService {
  private limiter = new Bottleneck({
    reservoir: 20, // Вызовов в секунду
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 1000, // 1 секунда
  });

  private symbolsUsed = 0;
  private lastReset = Date.now();

  constructor(private readonly configService: ConfigService) {}

  private resetSymbolsCounter() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) { // 3600000 мс = 1 час
      this.symbolsUsed = 0;
      this.lastReset = now;
    }
  }

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.configService.get<string>('KEY_FILE_PATH'), 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
    const payload = {
      aud: this.configService.get<string>('IAM_TOKEN_URL'),
      iss: service_account_id,
      iat: now,
      exp: now + 3600,
    };

    const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
    const jws = await jose.JWS.createSign({ format: 'compact' }, key)
      .update(JSON.stringify(payload))
      .final();

    const response = await axios.post(this.configService.get<string>('IAM_TOKEN_URL'), {
      jwt: jws,
    });

    return response.data.iamToken;
  }

  public async translateText(text: string, targetLang: string): Promise<string> {
    this.resetSymbolsCounter();

    if (this.symbolsUsed + text.length > 1_000_000) {
      throw new Error('Превышен лимит символов в час');
    }

    return this.limiter.schedule(async () => {
      const iamToken = await this.getIamToken();
      const folderId = this.configService.get<string>('YOUR_FOLDER_ID');

      const response = await axios.post(
        this.configService.get<string>('TRANSLATE_API_URL'),
        {
          folderId,
          texts: [text],
          targetLanguageCode: targetLang,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${iamToken}`,
          },
        },
      );

      this.symbolsUsed += text.length;

      return response.data.translations[0].text;
    });
  }
}

Контроллер translation.controller.ts
Добавьте контроллер для обработки запросов на перевод:
typescriptimport { Controller, Get, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async translate(@Query('text') text: string, @Query('lang') lang: string): Promise<string> {
    return this.translationService.translateText(text, lang);
  }
}

Обновление модуля
Убедитесь, что ваш основной модуль настроен для использования ConfigModule и вашего сервиса:
typescriptimport { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TranslationController],
  providers: [TranslationService],
})
export class AppModule {}

Примечания

Безопасность: Убедитесь, что ваш JSON-файл с ключами хранится в безопасном месте.
Обработка ошибок: Добавьте обработку ошибок для более надёжной работы.
Ограничения: Убедитесь, что вы учитываете ограничения API и соблюдаете лимиты.

Если вы видите ошибки 404 при попытке доступа к URL, проверьте правильность адреса и убедитесь, что вы используете актуальные и поддерживаемые API. Если проблема с URL-анализом в чате, попробуйте отключить функцию анализа URL в настройках.Контекст сброшенДавайте создадим сервис для перевода текста с использованием Yandex Translate API в приложении на Nest.js. Мы будем хранить все конфигурационные параметры в файле .env и извлекать их с помощью ConfigService.Файл .envСоздайте файл .env в корне вашего проекта и добавьте туда следующие строки:plaintextIAM_TOKEN_URL=https://iam.api.cloud.yandex.net/iam/v1/tokens
TRANSLATE_API_URL=https://translate.api.cloud.yandex.net/translate/v2/translate
KEY_FILE_PATH=./key.json
YOUR_FOLDER_ID=ваш_идентификатор_каталога

Сервис translation.service.ts
Создайте или обновите translation.service.ts:
typescriptimport { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as jose from 'node-jose';
import Bottleneck from 'bottleneck';

@Injectable()
export class TranslationService {
  private limiter = new Bottleneck({
    reservoir: 20, // Вызовов в секунду
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 1000, // 1 секунда
  });

  private symbolsUsed = 0;
  private lastReset = Date.now();

  constructor(private readonly configService: ConfigService) {}

  private resetSymbolsCounter() {
    const now = Date.now();
    if (now - this.lastReset >= 3600000) { // 3600000 мс = 1 час
      this.symbolsUsed = 0;
      this.lastReset = now;
    }
  }

  private async getIamToken(): Promise<string> {
    const json = JSON.parse(fs.readFileSync(this.configService.get<string>('KEY_FILE_PATH'), 'utf8'));
    const { private_key, service_account_id, id } = json;

    const now = Math.floor(new Date().getTime() / 1000);
    const payload = {
      aud: this.configService.get<string>('IAM_TOKEN_URL'),
      iss: service_account_id,
      iat: now,
      exp: now + 3600,
    };

    const key = await jose.JWK.asKey(private_key, 'pem', { kid: id, alg: 'PS256' });
    const jws = await jose.JWS.createSign({ format: 'compact' }, key)
      .update(JSON.stringify(payload))
      .final();

    const response = await axios.post(this.configService.get<string>('IAM_TOKEN_URL'), {
      jwt: jws,
    });

    return response.data.iamToken;
  }

  public async translateText(text: string, targetLang: string): Promise<string> {
    this.resetSymbolsCounter();

    if (this.symbolsUsed + text.length > 1_000_000) {
      throw new Error('Превышен лимит символов в час');
    }

    return this.limiter.schedule(async () => {
      const iamToken = await this.getIamToken();
      const folderId = this.configService.get<string>('YOUR_FOLDER_ID');

      const response = await axios.post(
        this.configService.get<string>('TRANSLATE_API_URL'),
        {
          folderId,
          texts: [text],
          targetLanguageCode: targetLang,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${iamToken}`,
          },
        },
      );

      this.symbolsUsed += text.length;

      return response.data.translations[0].text;
    });
  }
}

Контроллер translation.controller.ts
Добавьте контроллер для обработки запросов на перевод:
typescriptimport { Controller, Get, Query } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('translate')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Get()
  async translate(@Query('text') text: string, @Query('lang') lang: string): Promise<string> {
    return this.translationService.translateText(text, lang);
  }
}

Обновление модуля
Убедитесь, что ваш основной модуль настроен для использования ConfigModule и вашего сервиса:
typescriptimport { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [TranslationController],
  providers: [TranslationService],
})
export class AppModule {}

Примечания

Безопасность: Убедитесь, что ваш JSON-файл с ключами хранится в безопасном месте.
Обработка ошибок: Добавьте обработку ошибок для более надёжной работы.
Ограничения: Убедитесь, что вы учитываете ограничения API и соблюдаете лимиты.

Если вы видите ошибки 404 при попытке доступа к URL, проверьте правильность адреса и убедитесь, что вы используете актуальные и поддерживаемые API. Если проблема с URL-анализом в чате, попробуйте отключить функцию анализа URL в настройках.

Подскажи можно делать переводы json объектов?ChatGPTgpt-4o-7 160 CAPSПри попытке использовать Yandex Translate API вы столкнулись с ошибками 404, что означает, что указанные вами URL-адреса недоступны. Это может быть связано с неправильными URL-адресами или изменениями в API.Вот несколько шагов, которые вы можете предпринять, чтобы решить эту проблему:
Проверьте URL-адреса: Убедитесь, что вы используете правильные и актуальные URL-адреса для Yandex Translate API и IAM Token API. Проверьте документацию Yandex Cloud на предмет актуальных URL-адресов и эндпоинтов.

Обновите свои ключи и идентификаторы: Проверьте правильность ключа доступа, идентификатора каталога и других конфигурационных параметров, которые вы используете в вашем приложении.

Проверьте настройки сети: Убедитесь, что у вас есть доступ к интернету и ваш брандмауэр или сеть не блокирует доступ к API Yandex.

Обратитесь в поддержку: Если проблемы продолжаются, обратитесь в поддержку Yandex Cloud для получения дополнительной помощи.

Отключите анализ URL: Если вы видите ошибки, связанные с анализом URL-адресов в чате, попробуйте отключить эту функцию в настройках чата.
Если проблема связана с указанными URL-адресами, пожалуйста, посетите сайты:

IAM Token API
Translate API
Если возникнут ошибки, пожалуйста, сообщите об этом и отключите функцию анализа URL, если она не была запрошена вами.Нее, все работает ок. Подскажи можно делать переводы json объектов?ChatGPTgpt-4o-9 084 CAPSДа, вы можете переводить JSON-объекты, но вам нужно будет пройти через несколько дополнительных шагов. Поскольку API перевода обычно работают с текстовыми строками, вам нужно будет извлечь текст для перевода из JSON-объекта, отправить его на перевод, а затем встроить переведенный текст обратно в исходный JSON.Вот общий план действий:
Извлечение строк для перевода: Пройдите по вашему JSON-объекту и извлеките строки, которые требуют перевода. Это может быть сделано с помощью рекурсивной функции, которая обрабатывает каждый элемент JSON.

Перевод строк: Отправьте извлеченные строки на перевод с помощью вашего сервиса TranslationService. Вы можете использовать созданный вами метод translateText для каждой строки.

Замена переведенных строк в JSON: После получения переведенных строк замените оригинальные строки в JSON-объекте переведенными.

Обработка ошибок и крайних случаев: Убедитесь, что ваш код обрабатывает ошибки, такие как отсутствие текстовых строк или неправильные форматы данных.
Пример кода для обработки JSON:typescriptimport { Injectable } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Injectable()
export class JsonTranslationService {
  constructor(private readonly translationService: TranslationService) {}

  async translateJson(json: any, targetLang: string): Promise<any> {
    const translateRecursive = async (obj: any): Promise<any> => {
      if (typeof obj === 'string') {
        return await this.translationService.translateText(obj, targetLang);
      }

      if (Array.isArray(obj)) {
        return await Promise.all(obj.map(item => translateRecursive(item)));
      }

      if (typeof obj === 'object' && obj !== null) {
        const translatedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          translatedObj[key] = await translateRecursive(value);
        }
        return translatedObj;
      }

      return obj;
    };

    return await translateRecursive(json);
  }
}

В этом примере JsonTranslationService рекурсивно проходит по JSON-объекту и переводит строки с использованием TranslationService. Обратите внимание, что для каждого вызова перевода могут потребоваться дополнительные проверки и обработка ошибок.Если передвать json Json.strinngfy он не будет переводить?ChatGPTgpt-4o-8 236 CAPSЕсли вы передадите JSON-объект в виде строки, используя JSON.stringify, в функцию перевода, то API перевода, скорее всего, попытается перевести весь JSON как одну строку. Это может привести к нежелательным результатам, поскольку перевод будет применен ко всему тексту сразу, включая ключи и синтаксис JSON (например, скобки, двоеточия и запятые).Вот почему просто передавать JSON.stringify объект в API перевода не рекомендуется. Это может нарушить структуру JSON и привести к некорректному формату данных.Вместо этого, как я упоминал ранее, лучше извлечь только те части JSON, которые требуют перевода (например, значения строк), перевести их, а затем собрать JSON обратно. Это позволит сохранить структуру JSON и корректно перевести текстовые данные.Если у вас есть строго структурированный JSON и вы уверены, что все строки внутри JSON требуют перевода одинаковым образом, вы можете попробовать перевести его целиком, но будьте готовы к необходимости восстановления структуры JSON вручную после перевода.