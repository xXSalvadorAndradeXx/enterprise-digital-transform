import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';


async function bootstrap() {
  // Crea la app a partir del módulo raíz
  const app = await NestFactory.create(AppModule);

  // HABILITAR CORS
  app.enableCors();

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter()); 
  // Validaciones globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  
  // Puerto
  await app.listen(3000);

  console.log(`API corriendo en: http://localhost:3000/api`);
}

bootstrap();