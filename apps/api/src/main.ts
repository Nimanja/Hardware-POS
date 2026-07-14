import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { API_VERSION } from '@hardware-pos/shared';

import { AppModule } from './app.module';
import { getUploadDir, UPLOAD_URL_PREFIX } from './common/storage/storage.util';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix(API_VERSION);
  // Serve uploaded product images (outside the versioned API prefix), e.g. /uploads/<file>.
  app.useStaticAssets(getUploadDir(), { prefix: UPLOAD_URL_PREFIX });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    credentials: true,
    // Lets the browser read the filename of exported reports.
    exposedHeaders: ['Content-Disposition'],
  });

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port);

  Logger.log(`Hardware POS API listening on http://localhost:${port}/${API_VERSION}`, 'Bootstrap');
}

void bootstrap();
