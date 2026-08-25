import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const host = 'http://localhost';

  // Servir estáticamente la carpeta uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });


  // Prefijo global de la API
  app.setGlobalPrefix(apiPrefix);

  // Configuración de CORS
  app.enableCors({
    origin: ['http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Cart-Token',
      'X-Order-Access-Token',
    ],
    exposedHeaders: ['X-Cart-Token'],
  });

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  // Interceptores y filtros globales de respuesta estándar
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configuración de Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ecommerce API')
    .setDescription('Backend RESTful para el sistema de Ecommerce')
    .setVersion('v1.2')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      displayRequestDuration: true,
      filter: true,
    },
    customSiteTitle: 'Ecommerce API - Swagger',
  });

  await app.listen(port);

  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.log('🚀 Ecommerce API iniciada correctamente');
  logger.log('');
  logger.log(`🌐 API Base     : ${host}:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger UI  : ${host}:${port}/${apiPrefix}/docs`);
  logger.log(`⚡ Entorno      : ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`🔌 Puerto       : ${port}`);
  logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

bootstrap();