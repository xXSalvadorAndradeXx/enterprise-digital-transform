import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  // Crear app
  const app = await NestFactory.create(AppModule);

  // Configuración CORS
  app.enableCors({
    origin: [
      'http://localhost:3001', // Frontend React
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Prefijo global
  app.setGlobalPrefix('api');

  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Filtro global de errores
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Tienda API')
    .setDescription('API REST del backend')
    .setVersion('1.0')
    .addBearerAuth() // para JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Puerto
  await app.listen(3000);

  console.log('API corriendo en: http://localhost:3000/api');
  console.log('Docs Swagger: http://localhost:3000/api/docs');
}

bootstrap();