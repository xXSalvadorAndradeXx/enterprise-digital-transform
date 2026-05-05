import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Crea la app a partir del módulo raíz
  const app = await NestFactory.create(AppModule);
  
  // Prefijo global para todas las rutas: /api/auth, /api/products, etc.
  app.setGlobalPrefix('api');
  
  // Escucha en el puerto 3000
  await app.listen(3000);
  
  console.log(`API corriendo en: http://localhost:3000/api`);
}

bootstrap();
