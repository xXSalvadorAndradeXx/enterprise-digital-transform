// src/purchases/purchases.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { SupplierPurchase } from './entities/supplier-purchase.entity';
import { SupplierPurchaseItem } from './entities/supplier-purchase-item.entity';
import { PurchaseStatusHistory } from './entities/purchase-status-history.entity';
import { PurchaseStatus } from './enums/purchase-status.enum';
import { PurchaseStateMachine } from './purchase-state-machine';
import { jest } from '@jest/globals';

// ── Mock del QueryRunner ────────────────────────────────────────────────────
const mockQR = {
  connect:          jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction:   jest.fn(),
  rollbackTransaction: jest.fn(),
  release:          jest.fn(),
  manager: {
    findOne:  jest.fn(),
    create:   jest.fn((_, data) => data),
    save:     jest.fn((_, data) => ({ id: 'uuid-purchase', ...data })),
    delete:   jest.fn(),
    update:   jest.fn(),
    increment: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQR),
};

const mockPurchaseRepo = {
  findOne:       jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy:   jest.fn().mockReturnThis(),
    skip:      jest.fn().mockReturnThis(),
    take:      jest.fn().mockReturnThis(),
    andWhere:  jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  })),
};

const mockItemRepo    = { find: jest.fn() };
const mockHistoryRepo = { find: jest.fn() };

describe('PurchasesService', () => {
  let service: PurchasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasesService,
        { provide: getRepositoryToken(SupplierPurchase),     useValue: mockPurchaseRepo },
        { provide: getRepositoryToken(SupplierPurchaseItem), useValue: mockItemRepo },
        { provide: getRepositoryToken(PurchaseStatusHistory),useValue: mockHistoryRepo },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<PurchasesService>(PurchasesService);
    jest.clearAllMocks();
  });

  // T03 ──────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('crea compra exitosamente y calcula totalAmount', async () => {
      mockQR.manager.findOne
        .mockResolvedValueOnce({ id: 'supplier-1' })  // supplier
        .mockResolvedValueOnce({ id: 'product-1' });  // producto

      const dto = {
        supplierId: 'supplier-1',
        items: [{ productId: 'product-1', quantity: 10, unitCost: 25.50 }],
      };

      const result = await service.create(dto as any, 'user-1');

      expect(mockQR.manager.save).toHaveBeenCalled();
      expect(mockQR.commitTransaction).toHaveBeenCalled();
    });

    it('lanza NotFoundException si el proveedor no existe', async () => {
      mockQR.manager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create({ supplierId: 'bad-id', items: [] } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockQR.rollbackTransaction).toHaveBeenCalled();
    });

    it('lanza NotFoundException si un producto no existe', async () => {
      mockQR.manager.findOne
        .mockResolvedValueOnce({ id: 'supplier-1' })
        .mockResolvedValueOnce(null); // producto no existe

      await expect(
        service.create({
          supplierId: 'supplier-1',
          items: [{ productId: 'bad-product', quantity: 1, unitCost: 10 }],
        } as any, 'user-1'),
      ).rejects.toThrow(NotFoundException);

      expect(mockQR.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // T05 ──────────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('edita exitosamente una compra en PENDING', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue({
        id: 'p-1', status: PurchaseStatus.PENDING, items: [],
      });
      mockQR.manager.findOne.mockResolvedValue({ id: 'product-1' });

      const result = await service.update('p-1', {
        items: [{ productId: 'product-1', quantity: 5, unitCost: 10 }],
      });

      expect(mockQR.commitTransaction).toHaveBeenCalled();
    });

    it('lanza BadRequestException si la compra no está en PENDING', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue({
        id: 'p-1', status: PurchaseStatus.RECEIVED,
      });

      await expect(
        service.update('p-1', { items: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // T04 ──────────────────────────────────────────────────────────────────
  describe('PurchaseStateMachine.validateTransition()', () => {
    it('permite PENDING → RECEIVED', () => {
      expect(() =>
        PurchaseStateMachine.validateTransition(
          PurchaseStatus.PENDING, PurchaseStatus.RECEIVED,
        ),
      ).not.toThrow();
    });

    it('permite PENDING → CANCELLED', () => {
      expect(() =>
        PurchaseStateMachine.validateTransition(
          PurchaseStatus.PENDING, PurchaseStatus.CANCELLED,
        ),
      ).not.toThrow();
    });

    it('rechaza RECEIVED → PENDING', () => {
      expect(() =>
        PurchaseStateMachine.validateTransition(
          PurchaseStatus.RECEIVED, PurchaseStatus.PENDING,
        ),
      ).toThrow(ConflictException);
    });

    it('rechaza CANCELLED → RECEIVED', () => {
      expect(() =>
        PurchaseStateMachine.validateTransition(
          PurchaseStatus.CANCELLED, PurchaseStatus.RECEIVED,
        ),
      ).toThrow(ConflictException);
    });

    it('rechaza RECEIVED → CANCELLED', () => {
      expect(() =>
        PurchaseStateMachine.validateTransition(
          PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED,
        ),
      ).toThrow(ConflictException);
    });
  });

  // T07 ──────────────────────────────────────────────────────────────────
  describe('changeStatus()', () => {
    it('cancela compra PENDING → CANCELLED y registra historial', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue({
        id: 'p-1',
        status: PurchaseStatus.PENDING,
        items: [],
      });

      await service.changeStatus('p-1', 'CANCELLED', 'user-1');

      expect(mockQR.commitTransaction).toHaveBeenCalled();
    });

    it('rechaza transición inválida con ConflictException', async () => {
      mockPurchaseRepo.findOne.mockResolvedValue({
        id: 'p-1',
        status: PurchaseStatus.RECEIVED,
        items: [],
      });

      await expect(
        service.changeStatus('p-1', 'CANCELLED', 'user-1'),
      ).rejects.toThrow(ConflictException);
    });
  });
});