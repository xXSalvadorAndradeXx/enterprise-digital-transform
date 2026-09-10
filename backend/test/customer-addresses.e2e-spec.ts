/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../src/module/customers/entities/customer.entity';
import { CustomerAddress } from '../src/module/customers/entities/customer-address.entity';
import { Department } from '../src/module/branches/entities/department.entity';
import { District } from '../src/module/branches/entities/district.entity';

describe('Customer Addresses Full Lifecycle & Checkout Integration (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let customerRepo: Repository<Customer>;
  let addressRepo: Repository<CustomerAddress>;
  let departmentRepo: Repository<Department>;
  let districtRepo: Repository<District>;

  let tokenCustomerA: string;
  let tokenCustomerB: string;
  let tokenCustomerC: string;

  let customerA: Customer;
  let customerB: Customer;
  let customerC: Customer;

  let testDepartment1: Department;
  let testDistrict1: District;
  let testDepartment2: Department;
  let testDistrict2: District;

  let customerAAddress1Id: string;
  let customerAAddress2Id: string;
  let customerAAddress3Id: string;
  let customerBAddressId: string;

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

    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);
    customerRepo = app.get(getRepositoryToken(Customer));
    addressRepo = app.get(getRepositoryToken(CustomerAddress));
    departmentRepo = app.get(getRepositoryToken(Department));
    districtRepo = app.get(getRepositoryToken(District));

    const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
    const timestamp = Date.now();

    // 1. Asegurar catálogo de departamentos y distritos
    let dep1 = await departmentRepo.findOne({ where: { code: 'SS' } });
    if (!dep1) {
      dep1 = await departmentRepo.save(
        departmentRepo.create({ name: 'San Salvador', code: 'SS', isActive: true }),
      );
    }
    testDepartment1 = dep1;

    let dist1 = await districtRepo.findOne({ where: { departmentId: testDepartment1.id } });
    if (!dist1) {
      dist1 = await districtRepo.save(
        districtRepo.create({ name: 'San Salvador', departmentId: testDepartment1.id, isActive: true }),
      );
    }
    testDistrict1 = dist1;

    let dep2 = await departmentRepo.findOne({ where: { code: 'LL' } });
    if (!dep2) {
      dep2 = await departmentRepo.save(
        departmentRepo.create({ name: 'La Libertad', code: 'LL', isActive: true }),
      );
    }
    testDepartment2 = dep2;

    let dist2 = await districtRepo.findOne({ where: { departmentId: testDepartment2.id } });
    if (!dist2) {
      dist2 = await districtRepo.save(
        districtRepo.create({ name: 'Santa Tecla', departmentId: testDepartment2.id, isActive: true }),
      );
    }
    testDistrict2 = dist2;

    // 2. Crear Clientes A, B y C
    customerA = await customerRepo.save(
      customerRepo.create({
        fullName: 'Carlos Andrade (Cliente A)',
        email: `clientA_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-1`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerB = await customerRepo.save(
      customerRepo.create({
        fullName: 'Beatriz Morales (Cliente B)',
        email: `clientB_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-2`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerC = await customerRepo.save(
      customerRepo.create({
        fullName: 'César Romero (Cliente C Sin Direcciones)',
        email: `clientC_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-3`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    tokenCustomerA = jwtService.sign(
      { sub: customerA.id, email: customerA.email, type: 'access' },
      { secret },
    );

    tokenCustomerB = jwtService.sign(
      { sub: customerB.id, email: customerB.email, type: 'access' },
      { secret },
    );

    tokenCustomerC = jwtService.sign(
      { sub: customerC.id, email: customerC.email, type: 'access' },
      { secret },
    );
  });

  afterAll(async () => {
    // Limpieza de datos creados en pruebas
    if (customerA) await addressRepo.delete({ customerId: customerA.id });
    if (customerB) await addressRepo.delete({ customerId: customerB.id });
    if (customerC) await addressRepo.delete({ customerId: customerC.id });

    if (customerA) await customerRepo.delete(customerA.id);
    if (customerB) await customerRepo.delete(customerB.id);
    if (customerC) await customerRepo.delete(customerC.id);

    await app.close();
  });

  describe('1. Consulta Inicial y Contrato de Checkout para Cliente Sin Direcciones', () => {
    it('GET /customers/me/addresses debe retornar [] cuando el cliente no tiene direcciones', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerC}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Creación de Direcciones y Regla de Default Inicial Única', () => {
    it('debe registrar la primera dirección forzando isDefault = true aunque el payload envíe isDefault = false', async () => {
      const payload = {
        departmentId: String(testDepartment1.id),
        districtId: String(testDistrict1.id),
        alias: 'Casa Principal',
        recipientName: 'Carlos Andrade',
        phone: '+50371234567',
        addressLine: 'Colonia Escalón, Calle 1 #12',
        reference: 'Frente al parque comunal',
        city: 'San Salvador',
        isDefault: false, // Cliente manda false, pero al ser su primera DEBE ser true
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Dirección registrada correctamente.');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.isDefault).toBe(true);
      expect(res.body.data.alias).toBe('Casa Principal');
      expect(res.body.data.department.name).toBe(testDepartment1.name);
      expect(res.body.data.district.name).toBe(testDistrict1.name);

      customerAAddress1Id = res.body.data.id;
    });

    it('debe registrar una segunda dirección con isDefault = false sin alterar la primera', async () => {
      const payload = {
        departmentId: String(testDepartment1.id),
        districtId: String(testDistrict1.id),
        label: 'Oficina',
        recipientName: 'Carlos Andrade',
        phone: '+50371234567',
        addressLine: 'Centro Financiero Gigante, Nivel 5',
        isDefault: false,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isDefault).toBe(false);
      customerAAddress2Id = res.body.data.id;

      // Verificar que el listado ubica la default primero
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(2);
      expect(listRes.body.data[0].id).toBe(customerAAddress1Id);
      expect(listRes.body.data[0].isDefault).toBe(true);
      expect(listRes.body.data[1].id).toBe(customerAAddress2Id);
      expect(listRes.body.data[1].isDefault).toBe(false);
    });

    it('debe registrar una tercera dirección con isDefault = true y desmarcar la primera atómicamente', async () => {
      const payload = {
        departmentId: String(testDepartment2.id),
        districtId: String(testDistrict2.id),
        alias: 'Casa de Playa',
        recipientName: 'Carlos Andrade',
        phone: '+50379998888',
        addressLine: 'Playa El Tunco, Km 42',
        isDefault: true,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isDefault).toBe(true);
      customerAAddress3Id = res.body.data.id;

      // Verificar que ahora solo customerAAddress3Id es default y está de primera
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(3);
      expect(listRes.body.data[0].id).toBe(customerAAddress3Id);
      expect(listRes.body.data[0].isDefault).toBe(true);

      const defaultsCount = listRes.body.data.filter((a: any) => a.isDefault).length;
      expect(defaultsCount).toBe(1);
    });
  });

  describe('3. Validación de Catálogos Geográficos (Department / District)', () => {
    it('debe responder error de validación si el distrito no pertenece al departamento', async () => {
      const payload = {
        departmentId: String(testDepartment1.id), // San Salvador
        districtId: String(testDistrict2.id),     // Santa Tecla (pertenece a La Libertad)
        alias: 'Dirección Invalida',
        addressLine: 'Avenida Siempre Viva #123',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload);

      expect([400, 422]).toContain(res.status);
      expect([
        'VALIDATION_ERROR',
        'DISTRICT_NOT_FOUND',
        'INVALID_DISTRICT_DEPARTMENT',
        'INVALID_LOCATION',
      ]).toContain(res.body.error?.code);
    });

    it('debe responder error si el departmentId o districtId son inexistentes', async () => {
      const payload = {
        departmentId: '999999',
        districtId: '999999',
        alias: 'Dirección Fantasma',
        addressLine: 'Calle Desconocida #0',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload);

      expect([400, 404, 422]).toContain(res.status);
    });
  });

  describe('4. Aislamiento Multitenant entre Dos Clientes (Cliente A vs Cliente B)', () => {
    it('debe registrar una dirección para el Cliente B', async () => {
      const payload = {
        departmentId: String(testDepartment1.id),
        districtId: String(testDistrict1.id),
        alias: 'Residencia Beatriz',
        recipientName: 'Beatriz Morales',
        phone: '+50375554433',
        addressLine: 'Antiguo Cuscatlán #500',
        isDefault: true,
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerB}`)
        .send(payload)
        .expect(201);

      customerBAddressId = res.body.data.id;
      expect(customerBAddressId).toBeDefined();
    });

    it('Cliente A no debe poder consultar la dirección de Cliente B', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      const foundAlien = res.body.data.some((a: any) => a.id === customerBAddressId);
      expect(foundAlien).toBe(false);
    });

    it('Cliente A no debe poder actualizar la dirección de Cliente B (responde 404 ADDRESS_NOT_FOUND)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerBAddressId}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({ alias: 'Intento de Hack' })
        .expect(404);

      expect(res.body.error?.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('Cliente A no debe poder marcar como default la dirección de Cliente B (responde 404 ADDRESS_NOT_FOUND)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerBAddressId}/default`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(404);

      expect(res.body.error?.code).toBe('ADDRESS_NOT_FOUND');
    });

    it('Cliente A no debe poder eliminar la dirección de Cliente B (responde 404 ADDRESS_NOT_FOUND)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/customers/me/addresses/${customerBAddressId}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(404);

      expect(res.body.error?.code).toBe('ADDRESS_NOT_FOUND');
    });
  });

  describe('5. Actualización Parcial y Protección de Campos', () => {
    it('debe rechazar con 400 VALIDATION_ERROR si se intentan enviar campos no permitidos (customerId, id)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerAAddress1Id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send({
          customerId: customerB.id,
          id: '99999999-9999-9999-9999-999999999999',
        })
        .expect(400);

      expect(res.body.error?.code).toBe('VALIDATION_ERROR');
    });

    it('debe actualizar los campos permitidos y retornar DTO poblado con relaciones', async () => {
      const updatePayload = {
        alias: 'Casa Principal Renovada',
        recipientName: 'Carlos A. Andrade',
        reference: 'Frente al parque, portón blanco nuevo',
        phone: '+50370001122',
      };

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerAAddress1Id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerAAddress1Id);
      expect(res.body.data.alias).toBe('Casa Principal Renovada');
      expect(res.body.data.recipientName).toBe('Carlos A. Andrade');
      expect(res.body.data.phone).toBe('+50370001122');
      expect(res.body.data.department.name).toBe(testDepartment1.name);
      expect(res.body.data.district.name).toBe(testDistrict1.name);
    });
  });

  describe('6. Idempotencia al Establecer Dirección Principal', () => {
    it('debe responder 200 OK inmediatamente al invocar setDefault sobre la que ya es principal', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerAAddress3Id}/default`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerAAddress3Id);
      expect(res.body.data.isDefault).toBe(true);
    });

    it('debe cambiar de principal desmarcando la anterior cuando se invoca sobre otra dirección', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/addresses/${customerAAddress1Id}/default`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(customerAAddress1Id);
      expect(res.body.data.isDefault).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data[0].id).toBe(customerAAddress1Id);
      expect(listRes.body.data[0].isDefault).toBe(true);
      expect(listRes.body.data[1].isDefault).toBe(false);
      expect(listRes.body.data[2].isDefault).toBe(false);
    });
  });

  describe('7. Eliminación y Reasignación Determinística de Default', () => {
    it('eliminar una dirección secundaria no debe modificar la principal (newDefaultAddress = null)', async () => {
      // customerAAddress2Id no es default
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/customers/me/addresses/${customerAAddress2Id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedAddressId).toBe(customerAAddress2Id);
      expect(res.body.data.newDefaultAddress).toBeNull();

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(2);
      expect(listRes.body.data[0].id).toBe(customerAAddress1Id);
      expect(listRes.body.data[0].isDefault).toBe(true);
    });

    it('eliminar la dirección principal debe reasignar determinísticamente otra restante como principal', async () => {
      // customerAAddress1Id es default actualmente. Al eliminarla, debe reasignar customerAAddress3Id
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/customers/me/addresses/${customerAAddress1Id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedAddressId).toBe(customerAAddress1Id);
      expect(res.body.data.newDefaultAddress).toBeDefined();
      expect(res.body.data.newDefaultAddress.id).toBe(customerAAddress3Id);
      expect(res.body.data.newDefaultAddress.isDefault).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].id).toBe(customerAAddress3Id);
      expect(listRes.body.data[0].isDefault).toBe(true);
    });

    it('eliminar la última dirección restante debe permitir cero defaults y dejar lista vacía', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/customers/me/addresses/${customerAAddress3Id}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedAddressId).toBe(customerAAddress3Id);
      expect(res.body.data.newDefaultAddress).toBeNull();

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(listRes.body.data).toEqual([]);
    });
  });

  describe('8. Contrato Checkout Validado', () => {
    it('debe confirmar que los campos retornados cumplen plenamente con el formulario de envío en Checkout', async () => {
      // Volver a crear una dirección para verificar el contrato completo consumido por Checkout
      const payload = {
        departmentId: String(testDepartment1.id),
        districtId: String(testDistrict1.id),
        alias: 'Residencia Entrega Checkout',
        recipientName: 'Carlos Salvador Andrade',
        phone: '+50371234567',
        addressLine: 'Paseo General Escalón, Condominio Vista Real #4A',
        reference: 'Torre norte, intercomunicador 4A',
        city: 'San Salvador',
      };

      await request(app.getHttpServer())
        .post('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .send(payload)
        .expect(201);

      const listRes = await request(app.getHttpServer())
        .get('/api/v1/customers/me/addresses')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      const checkoutAddress = listRes.body.data[0];
      expect(checkoutAddress).toBeDefined();

      // Campos requeridos para Checkout:
      expect(checkoutAddress.recipientName).toBe('Carlos Salvador Andrade');
      expect(checkoutAddress.phone).toBe('+50371234567');
      expect(checkoutAddress.addressLine).toBe('Paseo General Escalón, Condominio Vista Real #4A');
      expect(checkoutAddress.reference).toBe('Torre norte, intercomunicador 4A');
      expect(checkoutAddress.departmentId).toBe(testDepartment1.id);
      expect(checkoutAddress.districtId).toBe(testDistrict1.id);
      expect(checkoutAddress.department.name).toBe(testDepartment1.name);
      expect(checkoutAddress.district.name).toBe(testDistrict1.name);
      expect(checkoutAddress.isDefault).toBe(true);
    });
  });
});
