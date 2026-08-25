import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

describe('Ecommerce Public API & Cart E2E Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/ecommerce/products', () => {
    it('should return 200 with paginated product list structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ecommerce/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('meta');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
    });

    it('should reject limit > 100 with 422 UNPROCESSABLE_ENTITY (VALIDATION_ERROR)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ecommerce/products?limit=101')
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should accept valid gender enum MEN, WOMEN, UNISEX, KIDS', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/ecommerce/products?gender=MEN')
        .expect(200);
    });

    it('should reject invalid gender with 422 VALIDATION_ERROR', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ecommerce/products?gender=INVALID_GENDER')
        .expect(422);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/ecommerce/products/:id', () => {
    it('should return 404 for non-existent product UUID', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/ecommerce/products/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('GET /api/v1/cart', () => {
    it('should return 400 CART_TOKEN_INVALID for guest request without X-Cart-Token header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.code).toBe('CART_TOKEN_INVALID');
    });
  });
});
