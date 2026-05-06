import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Crea la app a partir del módulo raíz
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas: /api/auth, /api/products, etc.
  app.setGlobalPrefix('api');

  // Activa validación en TODOS los endpoints automáticamente
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true,  // Error si llegan propiedades extra
    transform: true,             // Convierte tipos automáticamente (string→number)
  }));

  // Escucha en el puerto 3000
  await app.listen(3000);

  console.log(`API corriendo en: http://localhost:3000/api`);
}

bootstrap();
