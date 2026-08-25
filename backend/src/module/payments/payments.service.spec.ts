import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockOrder = {
    id: 'order-uuid-1',
    totalAmount: '150.00',
  };

  const mockPayment = {
    id: 'payment-uuid-1',
    orderId: 'order-uuid-1',
    paymentMethod: PaymentMethod.CARD,
    status: PaymentStatus.PENDING,
    amount: '150.00',
    currency: 'USD',
  };

  const mockPaymentRepo = {
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass, options) => {
            if (entityClass === Order) {
              if (options.where.id === 'order-uuid-1') return mockOrder;
              return null;
            }
            if (entityClass === Payment) {
              if (options.where.orderId === 'order-uuid-1') return null; // No existing payment by default
              if (options.where.id === 'payment-uuid-1') return { ...mockPayment };
              return null;
            }
            return null;
          }),
          create: jest.fn().mockImplementation((entityClass, data) => data),
          save: jest.fn().mockImplementation(async (entityClass, data) => data),
        };
        return cb(mockManager);
      }),
    },
  };

  const mockOrderRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create a payment successfully in PENDING status with correct order total amount', async () => {
      const dto = {
        orderId: 'order-uuid-1',
        paymentMethod: PaymentMethod.CARD,
        currency: 'USD',
      };

      const result = await service.createPayment(dto);

      expect(result).toBeDefined();
      expect(result.amount).toBe(mockOrder.totalAmount);
      expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('should throw NotFoundException if order does not exist', async () => {
      const dto = {
        orderId: 'non-existing-order-uuid',
        paymentMethod: PaymentMethod.CARD,
      };

      // Mock findOne to return null for Order inside transaction
      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return cb(mockManager);
      });

      await expect(service.createPayment(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if a payment already exists for the order', async () => {
      const dto = {
        orderId: 'order-uuid-1',
        paymentMethod: PaymentMethod.CARD,
      };

      // Mock findOne to return existing payment
      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockImplementation((entityClass) => {
            if (entityClass === Order) return mockOrder;
            if (entityClass === Payment) return mockPayment;
            return null;
          }),
        };
        return cb(mockManager);
      });

      await expect(service.createPayment(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('processCardPayment', () => {
    it('should transition a pending payment to APPROVED on success', async () => {
      const dto = {
        cardLastFour: '4321',
        cardBrand: 'Visa',
        transactionId: 'txn_123',
        responseCode: '00',
      };

      const result = await service.processCardPayment('payment-uuid-1', dto);

      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
      expect(result.cardLastFour).toBe('4321');
      expect(result.cardBrand).toBe('Visa');
    });

    it('should transition a pending payment to FAILED if responseCode is not 00', async () => {
      const dto = {
        cardLastFour: '4321',
        cardBrand: 'Visa',
        transactionId: 'txn_123',
        responseCode: '05', // Decline/Error
      };

      const result = await service.processCardPayment('payment-uuid-1', dto);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.failedAt).toBeDefined();
    });

    it('should throw BadRequestException if trying to process a payment that is not PENDING', async () => {
      const dto = {
        cardLastFour: '4321',
        cardBrand: 'Visa',
      };

      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockPayment,
            status: PaymentStatus.APPROVED, // already approved
          }),
        };
        return cb(mockManager);
      });

      await expect(service.processCardPayment('payment-uuid-1', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateTransition', () => {
    it('should prevent transitions from APPROVED back to PENDING', async () => {
      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockPayment,
            status: PaymentStatus.APPROVED,
          }),
        };
        return cb(mockManager);
      });

      await expect(
        service.markAsFailed('payment-uuid-1', { responseCode: '05' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow refunding an APPROVED payment', async () => {
      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockPayment,
            status: PaymentStatus.APPROVED,
          }),
          save: jest.fn().mockImplementation(async (entityClass, data) => data),
        };
        return cb(mockManager);
      });

      const result = await service.markAsRefunded('payment-uuid-1');
      expect(result.status).toBe(PaymentStatus.REFUNDED);
      expect(result.refundedAt).toBeDefined();
    });

    it('should throw BadRequestException when trying to refund a PENDING payment', async () => {
      mockPaymentRepo.manager.transaction.mockImplementationOnce(async (cb) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue({
            ...mockPayment,
            status: PaymentStatus.PENDING,
          }),
        };
        return cb(mockManager);
      });

      await expect(service.markAsRefunded('payment-uuid-1')).rejects.toThrow(BadRequestException);
    });
  });
});
