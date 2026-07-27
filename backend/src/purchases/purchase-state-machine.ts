// src/purchases/purchase-state-machine.ts
import { ConflictException } from '@nestjs/common';
import { PurchaseStatus } from './enums/purchase-status.enum';

// Transiciones válidas: PENDING → RECEIVED | CANCELLED
// Ninguna otra transición está permitida
const VALID_TRANSITIONS: Record<PurchaseStatus, PurchaseStatus[]> = {
  [PurchaseStatus.PENDING]:   [PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED],
  [PurchaseStatus.RECEIVED]:  [],
  [PurchaseStatus.CANCELLED]: [],
};

export class PurchaseStateMachine {
  static validateTransition(
    currentStatus: PurchaseStatus,
    newStatus: PurchaseStatus,
  ): void {
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

    if (!allowed.includes(newStatus)) {
      throw new ConflictException(
        `Transición inválida: ${currentStatus} → ${newStatus}. ` +
        `Transiciones permitidas desde ${currentStatus}: ` +
        `${allowed.length > 0 ? allowed.join(', ') : 'ninguna'}`,
      );
    }
  }
}