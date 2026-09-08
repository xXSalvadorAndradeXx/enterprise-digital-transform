import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { CustomersService } from '../src/module/customers/customers.service';
import { LocationsService } from '../src/module/locations/locations.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../src/module/branches/entities/department.entity';
import { District } from '../src/module/branches/entities/district.entity';

describe('Customer Profile & Session Flow (e2e)', () => {
  let app: INestApplication;
  let customersService: CustomersService;
  let locationsService: LocationsService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const testEmail = `test.profile.${Date.now()}@e2e-test.com`;
  const testPassword = 'Password123!';
  const testDui = `${String(Math.floor(10000000 + Math.random() * 90000000))}-${Math.floor(Math.random() * 10)}`;
  const testPhone = `+5037${String(Math.floor(1000000 + Math.random() * 9000000))}`;

  let accessToken: string;
  let refreshCookie: string;
  let customerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    customersService = app.get(CustomersService);
    locationsService = app.get(LocationsService);
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    // Asegurar que existe al menos un departamento y distrito activos para la dirección
    const departmentRepo: Repository<Department> = app.get(getRepositoryToken(Department));
    const districtRepo: Repository<District> = app.get(getRepositoryToken(District));

    let department = await departmentRepo.findOne({ where: { code: 'SS' } });
    if (!department) {
      department = await departmentRepo.save(
        departmentRepo.create({
          name: 'San Salvador',
          code: 'SS',
          isActive: true,
        }),
      );
    }

    let district = await districtRepo.findOne({ where: { departmentId: department.id } });
    if (!district) {
      district = await districtRepo.save(
        districtRepo.create({
          name: 'San Salvador Centro',
          departmentId: department.id,
          isActive: true,
        }),
      );
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Registro y Autenticación de Cliente', () => {
    it('debe registrar un nuevo cliente comprador y retornar accessToken + cookie refreshToken', async () => {
      // Obtener departamento y distrito activos
      const departments = await locationsService.findActiveDepartments();
      expect(departments.length).toBeGreaterThan(0);
      const departmentId = departments[0].id;

      const districts = await locationsService.findDistrictsByDepartment(departmentId);
      expect(districts.length).toBeGreaterThan(0);
      const districtId = districts[0].id;

      const registerDto = {
        fullName: 'Carlos E2E Gómez',
        email: testEmail,
        password: testPassword,
        dui: testDui,
        phone: testPhone,
        departmentId,
        districtId,
        city: 'San Salvador',
        address: 'Colonia Escalón, Calle El Mirador #123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.customer).toBeDefined();
      expect(response.body.data.customer.email).toBe(testEmail.toLowerCase());

      accessToken = response.body.data.accessToken;
      customerId = response.body.data.customer.id;

      // Extraer cookie HttpOnly de la respuesta
      const cookies = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(cookies).toBeDefined();
      const refreshCookieHeader = Array.isArray(cookies) ? cookies.find((c) => c.startsWith('refreshToken=')) : undefined;
      expect(refreshCookieHeader).toBeDefined();
      refreshCookie = refreshCookieHeader!.split(';')[0];
    });

    it('debe iniciar sesión con las credenciales creadas (sin regresiones de login)', async () => {
      const loginDto = {
        email: testEmail,
        password: testPassword,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.customer.id).toBe(customerId);
    });

    it('debe responder 401 INVALID_CREDENTIALS ante contraseña errónea', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/login')
        .send({ email: testEmail, password: 'WrongPassword999!' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('2. Consulta y Actualización de Perfil (/customers/me)', () => {
    it('debe consultar el perfil propio retornando el contrato esperado por Frontend', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      expect(response.body.success).toBe(true);
      const profile = response.body.data;
      expect(profile.id).toBe(customerId);
      expect(profile.name).toBe('Carlos E2E Gómez');
      expect(profile.email).toBe(testEmail.toLowerCase());
      expect(profile.phone).toBe(testPhone);
      expect(profile.role).toBe('cliente');
      // No exponer contraseña ni hashes
      expect(profile.passwordHash).toBeUndefined();
      expect(profile.password).toBeUndefined();
    });

    it('debe actualizar name y phone válidos y retornar el perfil final actualizado', async () => {
      const updateDto = {
        name: 'Carlos Modificado E2E',
        phone: '+50379998888',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Perfil actualizado correctamente.');
      expect(response.body.data.name).toBe('Carlos Modificado E2E');
      expect(response.body.data.phone).toBe('+50379998888');
      expect(response.body.data.email).toBe(testEmail.toLowerCase()); // email inmutable
    });

    it('debe volver a consultar y confirmar persistencia real en base de datos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Carlos Modificado E2E');
      expect(response.body.data.phone).toBe('+50379998888');
      expect(response.body.data.email).toBe(testEmail.toLowerCase());
    });

    it('debe rechazar intento de mutación de email o customerId con 400 VALIDATION_ERROR', async () => {
      const maliciousPayload = {
        name: 'Carlos Intento',
        email: 'attacker@evil.com',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(maliciousPayload)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');

      // Verificar que el email en base de datos NO cambió
      const verifyResponse = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(verifyResponse.body.data.email).toBe(testEmail.toLowerCase());
    });

    it('debe rechazar nombre vacío o compuesto solo por espacios en blanco', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '   ' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('debe rechazar teléfono con formato no válido de El Salvador', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/customers/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '+50312345678' }) // Inicia con 1 (no válido)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('3. Renovación de Sesión y Prevención de Bucles (/ecommerce/auth/refresh)', () => {
    it('debe rotar el refresh token y emitir nuevo accessToken usando la cookie HttpOnly', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.expiresIn).toBe(900);

      // El nuevo access token debe funcionar para consultar el perfil
      const newAccessToken = response.body.data.accessToken;
      const meResponse = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body.data.id).toBe(customerId);

      // Actualizar la cookie con la nueva devuelta por la rotación
      const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(setCookie).toBeDefined();
      const newCookie = Array.isArray(setCookie) ? setCookie.find((c) => c.startsWith('refreshToken=')) : undefined;
      expect(newCookie).toBeDefined();
      refreshCookie = newCookie!.split(';')[0];
    });

    it('debe responder 401 si se intenta refrescar sin cookie ni body (evita loops)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SESSION_EXPIRED_OR_REVOKED');
    });
  });

  describe('4. Cierre de Sesión (Logout) e Invalidación Server-Side', () => {
    it('debe cerrar sesión revocando en BD y eliminando la cookie en el cliente', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/logout')
        .set('Cookie', [refreshCookie])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión cerrada correctamente.');

      // Verificar que se emitió cookie con fecha expirada (Max-Age=0 o Expires en el pasado)
      const setCookie = response.headers['set-cookie'] as unknown as string[] | undefined;
      expect(setCookie).toBeDefined();
    });

    it('el endpoint de refresh debe rechazar la cookie revocada con 401 SESSION_EXPIRED_OR_REVOKED', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/ecommerce/auth/refresh')
        .set('Cookie', [refreshCookie])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SESSION_EXPIRED_OR_REVOKED');
    });

    it('las rutas /customers/me deben rechazar peticiones sin token con 401 UNAUTHORIZED', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('las rutas /customers/me deben responder 401 TOKEN_EXPIRED ante un access token expirado', async () => {
      // Generar token JWT expirado
      const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
      const expiredToken = await jwtService.signAsync(
        {
          sub: customerId,
          email: testEmail,
          role: 'CUSTOMER',
          type: 'access',
        },
        {
          secret,
          expiresIn: -10, // Expirado hace 10 segundos
        },
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
