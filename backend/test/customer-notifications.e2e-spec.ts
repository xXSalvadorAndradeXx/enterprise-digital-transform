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
import { Product } from '../src/module/products/entities/product.entity';
import { NotificationType } from '../src/module/notifications/enums/notification-type.enum';
import { NotificationTab } from '../src/module/notifications/enums/notification-tab.enum';
import { ProductStatus } from '../src/module/products/enums/product-status.enum';

describe('Customer Notifications REST Endpoints (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let customerRepo: Repository<Customer>;
  let notificationRepo: Repository<CustomerNotification>;
  let productRepo: Repository<Product>;

  let tokenCustomerA: string;
  let tokenCustomerB: string;
  let tokenCustomerC: string;

  let customerA: Customer;
  let customerB: Customer;
  let customerC: Customer;

  let notifA1: CustomerNotification;
  let notifA2: CustomerNotification;
  let notifA3: CustomerNotification;
  let notifB1: CustomerNotification;

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
    notificationRepo = app.get(getRepositoryToken(CustomerNotification));
    productRepo = app.get(getRepositoryToken(Product));

    const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
    const timestamp = Date.now();

    // Crear Clientes A, B y C
    customerA = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente A Notificaciones',
        email: `notifA_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-1`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerB = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente B Notificaciones',
        email: `notifB_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-2`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerC = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente C Sin Notificaciones',
        email: `notifC_${timestamp}@e2e.test`,
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

    // Crear un producto para vincular ofertas
    const product = await productRepo.save(
      productRepo.create({
        commercialName: 'Amoladora Angular E2E',
        description: 'Herramienta de corte',
        salePrice: 55.0,
        status: ProductStatus.ACTIVE,
        isPublished: true,
      }),
    );

    // Notificaciones Cliente A:
    // A1: Pedidos, no leída
    notifA1 = await notificationRepo.save(
      notificationRepo.create({
        customerId: customerA.id,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Pedido registrado #ORD-A1',
        message: 'Tu compra ha sido procesada.',
        actionUrl: '/cuenta/pedidos/ORD-A1',
        metadata: { orderNumber: 'ORD-A1', newStatus: 'PENDING' },
        isRead: false,
        readAt: null,
      }),
    );

    // A2: Ofertas, no leída
    notifA2 = await notificationRepo.save(
      notificationRepo.create({
        customerId: customerA.id,
        productId: product.id,
        type: NotificationType.FAVORITE_PRICE_DROPPED,
        title: '¡Bajó de precio un favorito!',
        message: 'Amoladora Angular ahora a $45.00',
        actionUrl: `/productos/${product.id}`,
        metadata: { productId: product.id, newPrice: 45.0, oldPrice: 55.0 },
        isRead: false,
        readAt: null,
      }),
    );

    // A3: Pedidos, leída
    notifA3 = await notificationRepo.save(
      notificationRepo.create({
        customerId: customerA.id,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Pedido entregado #ORD-A3',
        message: 'Tu compra fue entregada.',
        actionUrl: '/cuenta/pedidos/ORD-A3',
        metadata: { orderNumber: 'ORD-A3', newStatus: 'DELIVERED' },
        isRead: true,
        readAt: new Date('2026-09-08T10:00:00.000Z'),
      }),
    );

    // Notificaciones Cliente B:
    notifB1 = await notificationRepo.save(
      notificationRepo.create({
        customerId: customerB.id,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Pedido de Cliente B #ORD-B1',
        message: 'Notificación privada de B.',
        actionUrl: '/cuenta/pedidos/ORD-B1',
        metadata: { orderNumber: 'ORD-B1' },
        isRead: false,
        readAt: null,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Seguridad y Autenticación en Endpoints', () => {
    it('GET /api/v1/customers/me/notifications debe rechazar con 401 si no hay token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications')
        .expect(401);
    });

    it('GET /api/v1/customers/me/notifications/unread-count debe rechazar con 401 si no hay token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications/unread-count')
        .expect(401);
    });

    it('PATCH /api/v1/customers/me/notifications/:id/read debe rechazar con 401 si no hay token', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${notifA1.id}/read`)
        .expect(401);
    });

    it('PATCH /api/v1/customers/me/notifications/read-all debe rechazar con 401 si no hay token', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/customers/me/notifications/read-all')
        .expect(401);
    });
  });

  describe('2. Listado Paginado, Pestañas y Filtros (GET /customers/me/notifications)', () => {
    it('debe retornar todas las notificaciones del cliente sin ver las de otro cliente (Aislamiento)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(3);
      expect(res.body.data.meta.total).toBe(3);
      expect(res.body.data.meta.unreadCount).toBe(2);

      // Verificar que ninguna pertenezca al Cliente B
      const ids = res.body.data.notifications.map((n: any) => n.id);
      expect(ids).not.toContain(notifB1.id);
    });

    it('debe filtrar por pestaña Pedidos mediante type=ORDER_STATUS_CHANGED', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/customers/me/notifications?type=${NotificationType.ORDER_STATUS_CHANGED}`,
        )
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.data.notifications).toHaveLength(2);
      res.body.data.notifications.forEach((n: any) => {
        expect(n.type).toBe(NotificationType.ORDER_STATUS_CHANGED);
        expect(n.tab).toBe(NotificationTab.ORDERS);
      });
    });

    it('debe filtrar por pestaña Ofertas mediante type=FAVORITE_PRICE_DROPPED', async () => {
      const res = await request(app.getHttpServer())
        .get(
          `/api/v1/customers/me/notifications?type=${NotificationType.FAVORITE_PRICE_DROPPED}`,
        )
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].type).toBe(
        NotificationType.FAVORITE_PRICE_DROPPED,
      );
      expect(res.body.data.notifications[0].tab).toBe(NotificationTab.OFFERS);
      expect(res.body.data.notifications[0].productRef).toBeDefined();
    });

    it('debe filtrar por isRead=false retornando solo las pendientes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications?isRead=false')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.data.notifications).toHaveLength(2);
      res.body.data.notifications.forEach((n: any) => {
        expect(n.isRead).toBe(false);
      });
    });

    it('debe aplicar paginación limit=1 y page=1 de forma precisa', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications?page=1&limit=1')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(1);
      expect(res.body.data.meta.totalPages).toBe(3);
    });

    it('debe devolver un arreglo vacío estable para Cliente C sin notificaciones (Empty State)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications')
        .set('Authorization', `Bearer ${tokenCustomerC}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toEqual([]);
      expect(res.body.data.meta.total).toBe(0);
      expect(res.body.data.meta.totalPages).toBe(0);
      expect(res.body.data.meta.unreadCount).toBe(0);
    });
  });

  describe('3. Contador de No Leídas (GET /customers/me/notifications/unread-count)', () => {
    it('debe retornar unreadCount total y desglose por tipo/pestaña para Cliente A', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBe(2);
      expect(res.body.data.tabBreakdown).toEqual({
        [NotificationTab.ORDERS]: 1,
        [NotificationTab.OFFERS]: 1,
        [NotificationTab.SYSTEM]: 0,
      });
    });

    it('debe retornar ceros estables para Cliente C en O(1)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenCustomerC}`)
        .expect(200);

      expect(res.body.data.unreadCount).toBe(0);
      expect(res.body.data.tabBreakdown).toEqual({
        [NotificationTab.ORDERS]: 0,
        [NotificationTab.OFFERS]: 0,
        [NotificationTab.SYSTEM]: 0,
      });
    });
  });

  describe('4. Marcado Individual como Leído (PATCH /customers/me/notifications/:id/read)', () => {
    it('debe marcar como leída Notif A1 e incluir readAt', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${notifA1.id}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('debe ser idempotente si se vuelve a marcar como leída', async () => {
      const res1 = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${notifA1.id}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${notifA1.id}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res1.body.data.readAt).toEqual(res2.body.data.readAt);
    });

    it('debe rechazar con 404 NOTIFICATION_NOT_FOUND si Cliente A intenta leer notificación de B (Anti-IDOR)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${notifB1.id}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('NOTIFICATION_NOT_FOUND');
    });

    it('debe rechazar con 404 NOTIFICATION_NOT_FOUND si el id no existe', async () => {
      const nonExistentId = 'a0000000-0000-0000-0000-000000000000';
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/customers/me/notifications/${nonExistentId}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('NOTIFICATION_NOT_FOUND');
    });
  });

  describe('5. Marcado Masivo en Lote (PATCH /customers/me/notifications/read-all)', () => {
    it('debe marcar todas las restantes de Cliente A como leídas sin tocar las de Cliente B', async () => {
      // Cliente A tenía A2 pendiente (A1 se marcó arriba, A3 ya estaba leída)
      const resA = await request(app.getHttpServer())
        .patch('/api/v1/customers/me/notifications/read-all')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(resA.body.success).toBe(true);
      expect(resA.body.data.updatedCount).toBe(1);

      // Comprobar que Cliente B sigue teniendo su notificación B1 pendiente
      const countResB = await request(app.getHttpServer())
        .get('/api/v1/customers/me/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenCustomerB}`)
        .expect(200);

      expect(countResB.body.data.unreadCount).toBe(1);
    });

    it('debe retornar updatedCount=0 si Cliente A re-invoca read-all', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/customers/me/notifications/read-all')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(res.body.data.updatedCount).toBe(0);
    });
  });
});
