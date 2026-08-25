import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { User } from './../src/module/users/entities/user.entity';
import { Role } from './../src/module/roles/entities/role.entity';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

describe('Customers (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let unauthorizedToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    
    // Enable CORS to match main bootstrap
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

    // Register Interceptors and Exception Filters to replicate production responses
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);

    let unauthorizedRole = await roleRepo.findOne({ where: { name: 'UNAUTHORIZED_ROLE' } });
    if (!unauthorizedRole) {
      unauthorizedRole = await roleRepo.save(
        roleRepo.create({
          name: 'UNAUTHORIZED_ROLE',
          description: 'Sin permisos de lectura de clientes',
          permissions: [],
        }),
      );
    }

    let unauthorizedUser = await userRepo.findOne({ where: { email: 'unauthorized@company.com' } });
    if (!unauthorizedUser) {
      unauthorizedUser = await userRepo.save(
        userRepo.create({
          firstName: 'Unauthorized',
          lastName: 'User',
          email: 'unauthorized@company.com',
          passwordHash: 'dummy',
          isActive: true,
          roles: [unauthorizedRole],
        }),
      );
    }

    jwtService = app.get(JwtService);
    unauthorizedToken = await jwtService.signAsync({
      sub: unauthorizedUser.id,
      email: 'unauthorized@company.com',
      role: 'UNAUTHORIZED_ROLE',
      tokenVersion: unauthorizedUser.tokenVersion,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/admin/customers', () => {
    it('should reject unauthorized request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .expect(401);
    });

    it('should reject request with 403 if user lacks customers:read permission', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/customers')
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/admin/customers/:id', () => {
    it('should reject unauthorized request with 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/customers/d3b07384-d113-49cd-a5d6-8c4d5865dec1')
        .expect(401);
    });

    it('should reject request with 403 if user lacks customers:read permission', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/customers/d3b07384-d113-49cd-a5d6-8c4d5865dec1')
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });

    it('should reject invalid UUID with 401 (guard triggered first)', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/customers/invalid-uuid')
        .expect(401);
    });
  });

  describe('GET /api/v1/admin/customers/:id/orders', () => {
    it('should reject unauthorized request with 401', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/admin/customers/d3b07384-d113-49cd-a5d6-8c4d5865dec1/orders',
        )
        .expect(401);
    });

    it('should reject request with 403 if user lacks customers:read permission', async () => {
      await request(app.getHttpServer())
        .get(
          '/api/v1/admin/customers/d3b07384-d113-49cd-a5d6-8c4d5865dec1/orders',
        )
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });
  });

  describe('CORS and Headers configurations (e2e)', () => {
    it('should allow requests from http://localhost:3001 with Access-Control-Allow-Origin', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/admin/customers')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3001',
      );
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/admin/customers')
        .set('Origin', 'http://unauthorized.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should expose X-Cart-Token header', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/v1/admin/customers')
        .set('Origin', 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);
      expect(response.headers['access-control-expose-headers']).toContain(
        'X-Cart-Token',
      );
    });
  });

  describe('Password Policy (e2e)', () => {
    const defaultData = {
      fullName: 'Carlos Gómez',
      dui: '01234567-8',
      phone: '+50371234567',
      email: 'carlos.gomez@correo.com',
      departmentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      districtId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      addressLine: 'Residencial San Francisco, Senda 3, Casa #14',
    };

    it('should reject password with less than 12 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send({ ...defaultData, password: 'P@ss1!' })
        .expect(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password without uppercase character', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send({ ...defaultData, password: 'p@ssword1234!' })
        .expect(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password without lowercase character', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send({ ...defaultData, password: 'P@SSWORD1234!' })
        .expect(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password without number', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send({ ...defaultData, password: 'P@sswordword!' })
        .expect(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject password without symbol', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send({ ...defaultData, password: 'P4ssword1234' })
        .expect(400);
      expect(response.body.success).toBe(false);
    });
  });
});
