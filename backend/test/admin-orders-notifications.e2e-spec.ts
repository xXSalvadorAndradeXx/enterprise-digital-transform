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
import { CustomerNotification } from '../src/module/notifications/entities/customer-notification.entity';
import { Order } from '../src/module/orders/entities/order.entity';
import { User } from '../src/module/users/entities/user.entity';
import { Role } from '../src/module/roles/entities/role.entity';
import { Permission } from '../src/module/permissions/entities/permission.entity';
import { OrderStatus } from '../src/module/orders/enums/order-status.enum';
import { DeliveryMethod } from '../src/module/orders/enums/delivery-method.enum';
import { NotificationType } from '../src/module/notifications/enums/notification-type.enum';

describe('BE-ADM-NOT-10: E2E Integration Admin Orders -> Customer Notifications', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let customerRepo: Repository<Customer>;
  let notificationRepo: Repository<CustomerNotification>;
  let orderRepo: Repository<Order>;
  let userRepo: Repository<User>;
  let roleRepo: Repository<Role>;
  let permissionRepo: Repository<Permission>;

  let testCustomerToken: string;
  let testAdminToken: string;
  let testCustomer: Customer;
  let testAdminUser: User;
  let testOrderNumber: string;

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

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    customerRepo = moduleFixture.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    notificationRepo = moduleFixture.get<Repository<CustomerNotification>>(
      getRepositoryToken(CustomerNotification),
    );
    orderRepo = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    roleRepo = moduleFixture.get<Repository<Role>>(getRepositoryToken(Role));
    permissionRepo = moduleFixture.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );

    const timestamp = Date.now();

    // 1. Crear cliente de prueba y token de cliente (tipo access)
    testCustomer = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente Notificaciones E2E',
        email: `e2e-cust-notif-${timestamp}@test.com`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-1`,
        phone: '+50370001122',
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
    testCustomerToken = jwtService.sign(
      {
        sub: testCustomer.id,
        email: testCustomer.email,
        type: 'access',
        role: 'cliente',
      },
      { secret, expiresIn: '1h' },
    );

    // 2. Crear permisos, rol y usuario administrativo en BD para la estrategia JWT de Admin
    let permRead = await permissionRepo.findOne({
      where: { code: 'orders:read' },
    });
    if (!permRead) {
      permRead = await permissionRepo.save(
        permissionRepo.create({
          code: 'orders:read',
          description: 'Lectura de órdenes',
        }),
      );
    }

    let permUpdate = await permissionRepo.findOne({
      where: { code: 'orders:update' },
    });
    if (!permUpdate) {
      permUpdate = await permissionRepo.save(
        permissionRepo.create({
          code: 'orders:update',
          description: 'Actualización de órdenes',
        }),
      );
    }

    let adminRole = await roleRepo.findOne({
      where: { name: 'admin_e2e_role' },
      relations: ['permissions'],
    });

    if (!adminRole) {
      adminRole = await roleRepo.save(
        roleRepo.create({
          name: 'admin_e2e_role',
          description: 'Rol Admin para E2E',
          permissions: [permRead, permUpdate],
        }),
      );
    }

    testAdminUser = await userRepo.save(
      userRepo.create({
        firstName: 'Admin',
        lastName: 'E2E',
        email: `admin-e2e-${timestamp}@test.com`,
        passwordHash: 'hash_test_123',
        isActive: true,
        tokenVersion: 0,
        roles: [adminRole],
      }),
    );

    testAdminToken = jwtService.sign(
      {
        sub: testAdminUser.id,
        email: testAdminUser.email,
        tokenVersion: testAdminUser.tokenVersion,
      },
      { secret, expiresIn: '1h' },
    );

    // 3. Crear orden de prueba asociada al cliente
    testOrderNumber = `E2E${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder = orderRepo.create({
      orderNumber: testOrderNumber,
      customerId: testCustomer.id,
      customerEmail: testCustomer.email,
      customerName: testCustomer.fullName,
      customerPhone: testCustomer.phone,
      subtotal: '100.00',
      discountTotal: '0.00',
      deliveryCost: '0.00',
      totalAmount: '100.00',
      status: OrderStatus.PENDING,
      deliveryMethod: DeliveryMethod.HOME_DELIVERY,
    });
    await orderRepo.save(newOrder);
  });

  afterAll(async () => {
    if (testCustomer) {
      await notificationRepo.delete({ customerId: testCustomer.id });
    }
    if (testOrderNumber) {
      await orderRepo.delete({ orderNumber: testOrderNumber });
    }
    if (testCustomer) {
      await customerRepo.delete({ id: testCustomer.id });
    }
    if (testAdminUser) {
      await userRepo.delete({ id: testAdminUser.id });
    }
    await app.close();
  });

  it('1. Admin actualiza estado de PENDING a ON_ROUTE exitosamente', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${testOrderNumber}/status`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ status: OrderStatus.ON_ROUTE, notes: 'Despachado en camión 4' })
      .expect(200);

    expect(res.body.orderNumber).toBe(testOrderNumber);
    expect(res.body.status).toBe(OrderStatus.ON_ROUTE);
    expect(res.body.domainEvent).toBeUndefined();

    const orderInDb = await orderRepo.findOne({
      where: { orderNumber: testOrderNumber },
    });
    expect(orderInDb?.status).toBe(OrderStatus.ON_ROUTE);
  });

  it('2. Cliente consulta GET /customers/me/notifications y recibe la notificación del cambio de estado', async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const res = await request(app.getHttpServer())
      .get(
        `/api/v1/customers/me/notifications?type=${NotificationType.ORDER_STATUS_CHANGED}`,
      )
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    const notifications = res.body.data.notifications || res.body.data;
    expect(notifications.length).toBeGreaterThanOrEqual(1);

    const notification = notifications[0];
    const orderNumber =
      notification.orderRef?.orderNumber ||
      notification.metadata?.orderNumber ||
      notification.orderNumber;
    expect(orderNumber).toBe(testOrderNumber);
    expect(notification.title).toContain(testOrderNumber);
    expect(notification.title).toContain('en camino');
    expect(notification.message).toContain(testOrderNumber);
    expect(notification.message).toContain('dirección de entrega');
  });

  it('3. Idempotencia No-Op: Repetir el mismo estado ON_ROUTE no duplica el contador ni notificaciones', async () => {
    const initialRes = await request(app.getHttpServer())
      .get(
        `/api/v1/customers/me/notifications?type=${NotificationType.ORDER_STATUS_CHANGED}`,
      )
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .expect(200);

    const initialNotifications =
      initialRes.body.data.notifications || initialRes.body.data;
    const countBefore = initialNotifications.length;

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${testOrderNumber}/status`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ status: OrderStatus.ON_ROUTE })
      .expect(200);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const secondRes = await request(app.getHttpServer())
      .get(
        `/api/v1/customers/me/notifications?type=${NotificationType.ORDER_STATUS_CHANGED}`,
      )
      .set('Authorization', `Bearer ${testCustomerToken}`)
      .expect(200);

    const secondNotifications =
      secondRes.body.data.notifications || secondRes.body.data;
    const countAfter = secondNotifications.length;

    expect(countAfter).toBe(countBefore);
  });
});
