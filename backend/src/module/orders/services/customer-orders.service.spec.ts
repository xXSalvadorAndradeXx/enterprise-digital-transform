import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';
import { Order } from '../entities/order.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';

describe('CustomerOrdersService', () => {
  let service: CustomerOrdersService;
  let orderRepository: any;
  let customerRepository: any;

  const mockCustomerId = 'cust-uuid-123';
  const mockOrderNumber = 'A7K29P4Q';

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    orderRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn(),
    };

    customerRepository = {
      findOne: jest.fn(),
      exists: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerOrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomerOrdersService>(CustomerOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllByCustomer', () => {
    it('debería lanzar NotFoundException si el cliente no existe validando con exists()', async () => {
      customerRepository.exists.mockResolvedValue(false);

      await expect(service.findAllByCustomer(mockCustomerId)).rejects.toThrow(
        NotFoundException,
      );
      expect(customerRepository.exists).toHaveBeenCalledWith({
        where: { id: mockCustomerId },
      });
    });

    it('debería retornar lista paginada de órdenes del cliente con items resumen y orden DESC por defecto', async () => {
      customerRepository.exists.mockResolvedValue(true);
      const mockOrders = [
        {
          id: 'ord-1',
          orderNumber: 'A7K29P4Q',
          status: 'PENDING',
          createdAt: new Date(),
          deliveryMethod: 'HOME_DELIVERY',
          totalAmount: '100.00',
          items: [
            {
              quantity: 2,
              unitPrice: '25.00',
              subtotal: '50.00',
              product: {
                id: 'p-1',
                commercialName: 'Pintura Látex',
                isPublished: true,
                status: ProductStatus.ACTIVE,
                images: [
                  {
                    imageUrl: 'https://cdn.empresa.com/secundaria.jpg',
                    sortOrder: 2,
                  },
                  {
                    imageUrl: 'https://cdn.empresa.com/principal.jpg',
                    sortOrder: 1,
                  },
                ],
              },
            },
            {
              quantity: 1,
              unitPrice: '50.00',
              subtotal: '50.00',
              product: null, // Producto eliminado
            },
          ],
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockOrders, 1]);

      const result = await service.findAllByCustomer(mockCustomerId);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'order.customerId = :customerId AND order.customerId IS NOT NULL',
        { customerId: mockCustomerId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'order.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'order.id',
        'ASC',
      );
      expect(result.orders.length).toBe(1);
      expect(result.orders[0].itemsCount).toBe(3);
      expect(result.orders[0].items.length).toBe(2);
      expect(result.orders[0].items[0].productId).toBe('p-1');
      expect(result.orders[0].items[0].commercialName).toBe('Pintura Látex');
      expect(result.orders[0].items[0].imageUrl).toBe(
        'https://cdn.empresa.com/principal.jpg',
      );
      expect(result.orders[0].items[0].isAvailable).toBe(true);
      expect(result.orders[0].items[0].canRepurchase).toBe(true);
      // Producto eliminado
      expect(result.orders[0].items[1].productId).toBeNull();
      expect(result.orders[0].items[1].imageUrl).toBeNull();
      expect(result.orders[0].items[1].isAvailable).toBe(false);
      expect(result.orders[0].items[1].canRepurchase).toBe(false);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPreviousPage).toBe(false);
    });

    it('debería marcar isAvailable: false cuando el producto está despublicado o inactivo según política comercial', async () => {
      customerRepository.findOne.mockResolvedValue({ id: mockCustomerId });
      const mockOrders = [
        {
          id: 'ord-2',
          orderNumber: 'B8L30Q5R',
          status: 'PENDING',
          createdAt: new Date(),
          totalAmount: '50.00',
          items: [
            {
              quantity: 1,
              unitPrice: '50.00',
              subtotal: '50.00',
              product: {
                id: 'p-draft',
                commercialName: 'Producto Despublicado',
                isPublished: false,
                status: ProductStatus.DRAFT,
                images: [],
              },
            },
          ],
        },
      ];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockOrders, 1]);

      const result = await service.findAllByCustomer(mockCustomerId);

      expect(result.orders[0].items[0].productId).toBe('p-draft');
      expect(result.orders[0].items[0].isAvailable).toBe(false);
      expect(result.orders[0].items[0].canRepurchase).toBe(false);
    });

    it('debería retornar un estado vacío válido con metadata cuando el cliente no tiene pedidos', async () => {
      customerRepository.findOne.mockResolvedValue({ id: mockCustomerId });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAllByCustomer(mockCustomerId, {
        page: 1,
        limit: 10,
      });

      expect(result.orders).toEqual([]);
      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });

    it('debería calcular correctamente metadata de múltiples páginas (page=2, limit=5, total=12)', async () => {
      customerRepository.findOne.mockResolvedValue({ id: mockCustomerId });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 12]);

      const result = await service.findAllByCustomer(mockCustomerId, {
        page: 2,
        limit: 5,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('debería aplicar filtro por status y sortOrder personalizado', async () => {
      customerRepository.findOne.mockResolvedValue({ id: mockCustomerId });
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const queryDto = {
        page: 2,
        limit: 20,
        status: OrderStatus.ON_ROUTE,
        sortOrder: 'ASC' as const,
      };

      await service.findAllByCustomer(mockCustomerId, queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :statusFilter',
        {
          statusFilter: OrderStatus.ON_ROUTE,
        },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'order.createdAt',
        'ASC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('debería calcular count correcto con joins y paginación ante cliente con múltiples órdenes y múltiples artículos sin N+1', async () => {
      customerRepository.exists.mockResolvedValue(true);

      const mockOrder1 = {
        id: 'ord-multi-1',
        orderNumber: 'ORD00001',
        status: 'PENDING',
        createdAt: new Date('2026-09-08T10:00:00Z'),
        totalAmount: '120.00',
        items: [
          {
            quantity: 2,
            unitPrice: '20.00',
            subtotal: '40.00',
            product: {
              id: 'p1',
              commercialName: 'Item 1',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [],
            },
          },
          {
            quantity: 1,
            unitPrice: '30.00',
            subtotal: '30.00',
            product: {
              id: 'p2',
              commercialName: 'Item 2',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [],
            },
          },
          {
            quantity: 1,
            unitPrice: '50.00',
            subtotal: '50.00',
            product: {
              id: 'p3',
              commercialName: 'Item 3',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [],
            },
          },
        ],
      };

      const mockOrder2 = {
        id: 'ord-multi-2',
        orderNumber: 'ORD00002',
        status: 'DELIVERED',
        createdAt: new Date('2026-09-07T10:00:00Z'),
        totalAmount: '150.00',
        items: [
          {
            quantity: 3,
            unitPrice: '25.00',
            subtotal: '75.00',
            product: {
              id: 'p4',
              commercialName: 'Item 4',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [],
            },
          },
          {
            quantity: 2,
            unitPrice: '37.50',
            subtotal: '75.00',
            product: {
              id: 'p5',
              commercialName: 'Item 5',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [],
            },
          },
        ],
      };

      // TypeORM getManyAndCount retorna las 2 entidades paginadas y el TOTAL de órdenes únicas (3, no 8 items)
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        [mockOrder1, mockOrder2],
        3,
      ]);

      const result = await service.findAllByCustomer(mockCustomerId, {
        page: 1,
        limit: 2,
      });

      // Validar metadata de conteo
      expect(result.meta.total).toBe(3);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPreviousPage).toBe(false);
      expect(result.orders.length).toBe(2);

      // Validar agregaciones por orden (itemsCount suma piezas correctamente)
      expect(result.orders[0].id).toBe('ord-multi-1');
      expect(result.orders[0].itemsCount).toBe(4);
      expect(result.orders[0].items.length).toBe(3);

      expect(result.orders[1].id).toBe('ord-multi-2');
      expect(result.orders[1].itemsCount).toBe(5);
      expect(result.orders[1].items.length).toBe(2);

      // Evidencia de No N+1: exactamente 1 llamada a createQueryBuilder
      expect(orderRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(mockQueryBuilder.getManyAndCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOrdersForCustomer (alias de compatibilidad)', () => {
    it('debería delegar correctamente a findAllByCustomer con parámetros numéricos o DTO', async () => {
      const spy = jest.spyOn(service, 'findAllByCustomer').mockResolvedValue({
        orders: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });

      await service.findOrdersForCustomer(mockCustomerId, 2, 15);
      expect(spy).toHaveBeenCalledWith(
        mockCustomerId,
        expect.objectContaining({ page: 2, limit: 15 }),
      );

      const queryDto = { page: 3, limit: 5, sortOrder: 'DESC' as const };
      await service.findOrdersForCustomer(mockCustomerId, queryDto);
      expect(spy).toHaveBeenCalledWith(mockCustomerId, queryDto);
    });
  });

  describe('findOneByOrderNumber (y alias findOneForCustomer)', () => {
    it('debería consultar orderNumber y customerId en la misma query atómica', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByOrderNumber(mockCustomerId, mockOrderNumber),
      ).rejects.toThrow(NotFoundException);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {
          orderNumber: mockOrderNumber,
          customerId: mockCustomerId,
        },
        relations: [
          'items',
          'items.product',
          'items.product.images',
          'delivery',
          'delivery.branch',
          'payment',
          'statusHistory',
        ],
      });
    });

    it('debería lanzar NotFoundException con código ORDER_NOT_FOUND si la orden no existe', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      try {
        await service.findOneByOrderNumber(mockCustomerId, 'NOTFOUND');
      } catch (err: any) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.getResponse()).toEqual({
          code: 'ORDER_NOT_FOUND',
          message: 'No se encontró la orden con número NOTFOUND',
        });
      }
    });

    it('debería retornar 404 ORDER_NOT_FOUND si la orden pertenece a otro cliente (anti-enumeración e IDOR)', async () => {
      // Al filtrar en BD por { orderNumber, customerId: mockCustomerId },
      // si la orden pertenece a 'other-cust', la base de datos retorna null
      orderRepository.findOne.mockResolvedValue(null);

      try {
        await service.findOneByOrderNumber(mockCustomerId, 'OTHERORD');
      } catch (err: any) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect(err.getResponse().code).toBe('ORDER_NOT_FOUND');
      }
    });

    it('debería admitir inversión en los argumentos (orderNumber, customerId)', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByOrderNumber(mockOrderNumber, mockCustomerId),
      ).rejects.toThrow(NotFoundException);

      expect(orderRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            orderNumber: mockOrderNumber,
            customerId: mockCustomerId,
          },
        }),
      );
    });

    it('debería retornar el detalle histórico completo si la orden pertenece al cliente', async () => {
      const mockOrder = {
        id: 'ord-1',
        orderNumber: mockOrderNumber,
        customerId: mockCustomerId,
        status: 'NEW',
        deliveryMethod: 'HOME_DELIVERY',
        subtotal: '100.00',
        discountTotal: '10.00',
        deliveryCost: '5.00',
        totalAmount: '95.00',
        createdAt: new Date(),
        customerName: 'Juan Pérez',
        customerPhone: '+50371234567',
        items: [
          {
            id: 'item-1',
            quantity: 2,
            unitPrice: '50.00',
            discountSnapshot: '0.00',
            subtotal: '100.00',
            color: 'Blanco',
            size: 'Grande',
            sku: 'SKU-TEST-01',
            product: {
              id: 'prod-1',
              commercialName: 'Producto Test',
              isPublished: true,
              status: ProductStatus.ACTIVE,
              images: [
                { imageUrl: 'https://cdn.example.com/img1.jpg', sortOrder: 1 },
                { imageUrl: 'https://cdn.example.com/img0.jpg', sortOrder: 0 },
              ],
            },
          },
        ],
        delivery: {
          deliveryType: 'HOME_DELIVERY',
          shippingTotal: '5.00',
          departmentName: 'San Salvador',
          districtName: 'San Salvador Centro',
          city: 'San Salvador',
          addressLine: 'Calle Principal #123',
          trackingNumber: 'TRK-987654',
          estimatedDeliveryDate: new Date('2026-09-10'),
        },
        statusHistory: [
          {
            statusAfter: 'NEW',
            notes: 'Nota interna confidencial del operador',
            changedById: 'admin-erp-uuid',
            changedAt: new Date('2026-09-07T12:00:00Z'),
          },
        ],
      };

      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOneByOrderNumber(
        mockCustomerId,
        mockOrderNumber,
      );

      expect(result.orderNumber).toBe(mockOrderNumber);
      expect(result.itemsCount).toBe(2);
      expect(result.items.length).toBe(1);
      expect(result.items[0].productId).toBe('prod-1');
      expect(result.items[0].commercialName).toBe('Producto Test');
      expect(result.items[0].imageUrl).toBe('https://cdn.example.com/img0.jpg');
      expect(result.items[0].variantTitle).toBe('Blanco / Grande');
      expect(result.items[0].isAvailable).toBe(true);
      expect(result.items[0].canRepurchase).toBe(true);
      expect(result.delivery).toBeDefined();
      expect(result.delivery?.recipientName).toBe('Juan Pérez');
      expect(result.delivery?.shippingTotal).toBe('5.00');
      expect(result.delivery?.addressLine).toBe('Calle Principal #123');
      expect(result.timeline.length).toBe(1);
      expect(result.timeline[0].status).toBe('NEW');
      expect((result.timeline[0] as any).notes).toBeUndefined();
      expect(result.total).toBe('95.00');
    });

    it('debería retornar productId null y estado adecuado cuando el producto original ya no está disponible o fue eliminado', async () => {
      const mockOrderWithUnavailableProduct = {
        id: 'ord-2',
        orderNumber: mockOrderNumber,
        customerId: mockCustomerId,
        status: 'DELIVERED',
        totalAmount: '45.00',
        items: [
          {
            id: 'item-inactive',
            quantity: 1,
            unitPrice: '20.00',
            subtotal: '20.00',
            sku: 'SKU-INACT',
            product: {
              id: 'prod-inactive',
              commercialName: 'Producto Inactivo',
              isPublished: false,
              status: ProductStatus.PAUSED,
              images: [],
            },
          },
          {
            id: 'item-deleted',
            quantity: 1,
            unitPrice: '25.00',
            subtotal: '25.00',
            sku: 'SKU-DEL',
            product: null,
          },
        ],
        delivery: null,
        statusHistory: [],
      };

      orderRepository.findOne.mockResolvedValue(
        mockOrderWithUnavailableProduct,
      );

      const result = await service.findOneForCustomer(
        mockCustomerId,
        mockOrderNumber,
      );

      // Ítem 1: Producto despublicado / inactivo
      expect(result.items[0].productId).toBeNull();
      expect(result.items[0].isAvailable).toBe(false);
      expect(result.items[0].canRepurchase).toBe(false);
      expect(result.items[0].commercialName).toBe('Producto Inactivo');

      // Ítem 2: Producto eliminado físicamente (null)
      expect(result.items[1].productId).toBeNull();
      expect(result.items[1].isAvailable).toBe(false);
      expect(result.items[1].canRepurchase).toBe(false);
      expect(result.items[1].commercialName).toBe('Producto (SKU-DEL)');
    });
  });
});
