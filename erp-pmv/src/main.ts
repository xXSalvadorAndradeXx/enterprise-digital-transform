import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Variables de entorno ─────────────────────────────────────────────
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [];
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';

  // ── Prefijo global de API ────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);

  // ── Seguridad: Helmet ────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ─────────────────────────────────────────────────────────────
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    credentials: true,
  });

  // ── Validación global ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Filtro global de excepciones ─────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Interceptores globales ───────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(),
  );

  // ── Swagger ──────────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('ERP API — PMV')
      .setDescription('API REST del Producto Mínimo Viable del ERP')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Ingresa el access token JWT',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Users', 'Gestión de usuarios')
      .addTag('Roles', 'Gestión de roles')
      .addTag('Permissions', 'Permisos del sistema')
      .addTag('Suppliers', 'Proveedores')
      .addTag('Purchases', 'Compras a proveedores')
      .addTag('Products', 'Catálogo de productos')
      .addTag('Product Categories', 'Categorías de productos')
      .addTag('Inventory', 'Control de inventario')
      .addTag('Customers', 'Clientes')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger disponible en: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);
  logger.log(`🚀 Servidor iniciado en: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Entorno: ${nodeEnv}`);
}

bootstrap();