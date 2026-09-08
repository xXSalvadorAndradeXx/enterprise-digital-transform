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
import { Order } from '../src/module/orders/entities/order.entity';
import { OrderItem } from '../src/module/orders/entities/order-item.entity';
import { Product } from '../src/module/products/entities/product.entity';
import { ProductImage } from '../src/module/products/entities/product-image.entity';
import { OrderStatus } from '../src/module/orders/enums/order-status.enum';
import { DeliveryMethod } from '../src/module/orders/enums/delivery-method.enum';
import { ProductStatus } from '../src/module/products/enums/product-status.enum';

describe('Customer Orders REST Endpoints (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let customerRepo: Repository<Customer>;
  let orderRepo: Repository<Order>;
  let orderItemRepo: Repository<OrderItem>;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;

  let tokenCustomerA: string;
  let tokenCustomerB: string;
  let tokenCustomerC: string;

  let customerA: Customer;
  let customerB: Customer;
  let customerC: Customer;

  let orderA1Number: string;
  let orderA2Number: string;
  let orderB1Number: string;

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
    orderRepo = app.get(getRepositoryToken(Order));
    orderItemRepo = app.get(getRepositoryToken(OrderItem));
    productRepo = app.get(getRepositoryToken(Product));
    productImageRepo = app.get(getRepositoryToken(ProductImage));

    const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
    const timestamp = Date.now();

    // Crear Clientes A, B y C
    customerA = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente A Test',
        email: `custA_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-1`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerB = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente B Test',
        email: `custB_${timestamp}@e2e.test`,
        dui: `${String(Math.floor(10000000 + Math.random() * 89999999))}-2`,
        phone: `+5037${String(Math.floor(1000000 + Math.random() * 8999999))}`,
        passwordHash: 'hash_test_123',
        isActive: true,
      }),
    );

    customerC = await customerRepo.save(
      customerRepo.create({
        fullName: 'Cliente C Sin Pedidos',
        email: `custC_${timestamp}@e2e.test`,
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

    // Crear Producto Activo con Imagen
    const productActive = await productRepo.save(
      productRepo.create({
        commercialName: 'Taladro Percutor E2E 1/2 Pulgada',
        description: 'Herramienta eléctrica industrial',
        salePrice: 85.0,
        status: ProductStatus.ACTIVE,
        isPublished: true,
      }),
    );

    await productImageRepo.save(
      productImageRepo.create({
        productId: productActive.id,
        imageUrl: 'https://cdn.example.com/taladro-e2e.jpg',
        sortOrder: 1,
      }),
    );

    // Generar números de orden únicos
    orderA1Number = `E2EA${String(Math.floor(1000 + Math.random() * 8999))}`;
    orderA2Number = `E2EA${String(Math.floor(1000 + Math.random() * 8999))}`;
    orderB1Number = `E2EB${String(Math.floor(1000 + Math.random() * 8999))}`;

    // Orden A1 para Cliente A: 2 artículos (1 con producto activo, 1 con producto null/eliminado)
    const orderA1 = await orderRepo.save(
      orderRepo.create({
        orderNumber: orderA1Number,
        customerId: customerA.id,
        customerName: customerA.fullName,
        customerPhone: customerA.phone,
        status: OrderStatus.PENDING,
        subtotal: '95.00',
        totalAmount: '95.00',
        deliveryCost: '0.00',
        discountTotal: '0.00',
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      }),
    );

    await orderItemRepo.save([
      orderItemRepo.create({
        order: orderA1,
        product: productActive,
        quantity: 2,
        unitPrice: 25.0,
        salePriceSnapshot: 25.0,
        subtotal: 50.0,
      }),
      orderItemRepo.create({
        order: orderA1,
        product: null as any, // Simula producto eliminado del catálogo
        quantity: 1,
        unitPrice: 45.0,
        salePriceSnapshot: 45.0,
        subtotal: 45.0,
      }),
    ]);

    // Orden A2 para Cliente A: 1 artículo, estado DELIVERED
    const orderA2 = await orderRepo.save(
      orderRepo.create({
        orderNumber: orderA2Number,
        customerId: customerA.id,
        customerName: customerA.fullName,
        customerPhone: customerA.phone,
        status: OrderStatus.DELIVERED,
        subtotal: '85.00',
        totalAmount: '85.00',
        deliveryCost: '0.00',
        discountTotal: '0.00',
        deliveryMethod: DeliveryMethod.STORE_PICKUP,
      }),
    );

    await orderItemRepo.save(
      orderItemRepo.create({
        order: orderA2,
        product: productActive,
        quantity: 1,
        unitPrice: 85.0,
        salePriceSnapshot: 85.0,
        subtotal: 85.0,
      }),
    );

    // Orden B1 para Cliente B: 1 artículo, estado PENDING
    const orderB1 = await orderRepo.save(
      orderRepo.create({
        orderNumber: orderB1Number,
        customerId: customerB.id,
        customerName: customerB.fullName,
        customerPhone: customerB.phone,
        status: OrderStatus.PENDING,
        subtotal: '85.00',
        totalAmount: '85.00',
        deliveryCost: '0.00',
        discountTotal: '0.00',
        deliveryMethod: DeliveryMethod.HOME_DELIVERY,
      }),
    );

    await orderItemRepo.save(
      orderItemRepo.create({
        order: orderB1,
        product: productActive,
        quantity: 1,
        unitPrice: 85.0,
        salePriceSnapshot: 85.0,
        subtotal: 85.0,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Seguridad y Autenticación en Endpoints (/customers/me/orders)', () => {
    it('debe rechazar con 401 Unauthorized peticiones sin token JWT de cliente', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('debe rechazar con 401 Unauthorized la consulta de detalle sin token JWT', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/customers/me/orders/${orderA1Number}`)
        .expect(401);
    });
  });

  describe('2. Aislamiento Multi-Tenant y Ownership Estricto (Cliente A vs Cliente B)', () => {
    it('Cliente A debe consultar su historial y ver únicamente sus órdenes (nunca las de Cliente B)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const orders = response.body.data.items;
      expect(orders.length).toBe(2);

      const orderNumbers = orders.map((o: any) => o.orderNumber);
      expect(orderNumbers).toContain(orderA1Number);
      expect(orderNumbers).toContain(orderA2Number);
      expect(orderNumbers).not.toContain(orderB1Number);
    });

    it('Cliente B debe consultar su historial y ver únicamente sus órdenes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders')
        .set('Authorization', `Bearer ${tokenCustomerB}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const orders = response.body.data.items;
      expect(orders.length).toBe(1);
      expect(orders[0].orderNumber).toBe(orderB1Number);
    });

    it('Cliente A intentando acceder a la orden de Cliente B debe recibir 403 Forbidden (garantía de ownership)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/me/orders/${orderB1Number}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(403);

      expect(response.body.error.code).toBe('ORDER_FORBIDDEN');
    });
  });

  describe('3. Estado Vacío y Metadatos de Paginación Consistentes', () => {
    it('Cliente C sin órdenes debe recibir lista vacía con metadata válida (total: 0, totalPages: 1)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders')
        .set('Authorization', `Bearer ${tokenCustomerC}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toEqual([]);
      expect(response.body.data.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('4. Paginación Estable y Filtrado por Status', () => {
    it('debe soportar paginación con limit=1 calculando hasNextPage correctamente', async () => {
      const page1 = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(page1.body.data.items.length).toBe(1);
      expect(page1.body.data.meta.total).toBe(2);
      expect(page1.body.data.meta.totalPages).toBe(2);
      expect(page1.body.data.meta.hasNextPage).toBe(true);

      const page2 = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders?page=2&limit=1')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(page2.body.data.items.length).toBe(1);
      expect(page2.body.data.meta.hasNextPage).toBe(false);
      expect(page2.body.data.meta.hasPreviousPage).toBe(true);
    });

    it('debe filtrar pedidos por status DELIVERED', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders?status=DELIVERED')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(response.body.data.items.length).toBe(1);
      expect(response.body.data.items[0].orderNumber).toBe(orderA2Number);
      expect(response.body.data.items[0].status).toBe('DELIVERED');
    });
  });

  describe('5. Eficiencia de Tarjetas Frontend y Resiliencia de Catálogo (Sin N+1)', () => {
    it('debe retornar tarjeta completa con items resumen sin requerir petición de detalle', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      const orderA1Card = response.body.data.items.find(
        (o: any) => o.orderNumber === orderA1Number,
      );
      expect(orderA1Card).toBeDefined();
      expect(orderA1Card.itemsCount).toBe(3);
      expect(orderA1Card.total).toBe('95.00');
      expect(orderA1Card.deliveryType).toBe('HOME_DELIVERY');
      expect(orderA1Card.items.length).toBe(2);

      // Ítem 1: producto activo con imagen y recompra
      const itemActive = orderA1Card.items[0];
      expect(itemActive.productId).toBeDefined();
      expect(itemActive.imageUrl).toBe(
        'https://cdn.example.com/taladro-e2e.jpg',
      );
      expect(itemActive.isAvailable).toBe(true);
      expect(itemActive.canRepurchase).toBe(true);
      expect(itemActive.unitPrice).toBe('25.00');
      expect(itemActive.quantity).toBe(2);

      // Ítem 2: producto eliminado/null sin romper el historial
      const itemDeleted = orderA1Card.items[1];
      expect(itemDeleted.productId).toBeNull();
      expect(itemDeleted.imageUrl).toBeNull();
      expect(itemDeleted.isAvailable).toBe(false);
      expect(itemDeleted.canRepurchase).toBe(false);
      expect(itemDeleted.unitPrice).toBe('45.00');
      expect(itemDeleted.quantity).toBe(1);
    });
  });

  describe('6. Detalle de Orden Propio, Inexistente y Validación Sintáctica', () => {
    it('debe consultar el detalle completo de la orden propia', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/customers/me/orders/${orderA1Number}`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const detail = response.body.data;
      expect(detail.orderNumber).toBe(orderA1Number);
      expect(detail.total).toBe('95.00');
      expect(detail.itemsCount).toBe(3);
      expect(detail.items.length).toBe(2);
    });

    it('debe responder 404 Not Found cuando el orderNumber no existe', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders/NOEXISTE99')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(404);

      expect(response.body.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('debe responder 400 Bad Request cuando el orderNumber contiene caracteres no permitidos', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/customers/me/orders/INVALID@CHARS!')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_ORDER_NUMBER');
    });
  });
});
