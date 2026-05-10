import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  // Crear app
  const app = await NestFactory.create(AppModule);

  // Configuración CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
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
      whitelist: true,           // elimina campos no permitidos
      forbidNonWhitelisted: true, // lanza error si mandan campos extra
      transform: true,            // transforma tipos automáticamente
    }),
  );

  // Filtro global de errores
  app.useGlobalFilters(new AllExceptionsFilter());

  // Levantar servidor
  await app.listen(3000);

  console.log('API corriendo en: http://localhost:3000/api');
}

bootstrap();