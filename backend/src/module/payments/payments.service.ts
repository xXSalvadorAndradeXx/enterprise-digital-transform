import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  /**
   * Crea un pago inicial en estado PENDING asociado a una orden.
   * Captura el total verificado del backend (order.totalAmount).
   */
  async createPayment(
    createPaymentDto: CreatePaymentDto,
    externalManager?: EntityManager,
  ): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;

    return await manager.transaction(async (transactionalEntityManager) => {
      const { orderId, paymentMethod, currency } = createPaymentDto;

      // 1. Verificar si la orden existe
      const order = await transactionalEntityManager.findOne(Order, {
        where: { id: orderId },
      });
      if (!order) {
        throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
      }

      // 2. Verificar si ya existe un pago para esta orden
      const existingPayment = await transactionalEntityManager.findOne(Payment, {
        where: { orderId },
      });
      if (existingPayment) {
        throw new ConflictException(`Ya existe un pago registrado para la orden con ID ${orderId}`);
      }

      // 3. Crear el pago en estado PENDING capturando amount directamente de order.totalAmount
      const payment = transactionalEntityManager.create(Payment, {
        orderId,
        order,
        paymentMethod,
        status: PaymentStatus.PENDING,
        amount: order.totalAmount, // Snapshot del backend del total de la orden
        currency: currency || 'USD',
      });

      return await transactionalEntityManager.save(Payment, payment);
    });
  }

  /**
   * Procesa la confirmación de un pago con tarjeta transicionándolo a APPROVED o FAILED.
   */
  async processCardPayment(
    paymentId: string,
    dto: ProcessCardPaymentDto,
    externalManager?: EntityManager,
  ): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;

    return await manager.transaction(async (transactionalEntityManager) => {
      const payment = await transactionalEntityManager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${paymentId} no encontrado`);
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new BadRequestException(
          `No se puede procesar el pago con estado ${payment.status}. Solo se pueden procesar pagos PENDIENTES.`,
        );
      }

      // Simular procesamiento de tarjeta
      // Para fines de negocio, asumiremos aprobación a menos que ocurra un error específico o se simule fallo
      const isApproved = dto.responseCode ? dto.responseCode === '00' : true;

      if (isApproved) {
        return await this.markAsApprovedInternal(payment, dto, transactionalEntityManager);
      } else {
        return await this.markAsFailedInternal(payment, dto, transactionalEntityManager);
      }
    });
  }

  /**
   * Transiciona un pago a APPROVED
   */
  async markAsApproved(
    paymentId: string,
    details: Partial<Payment>,
    externalManager?: EntityManager,
  ): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;
    return await manager.transaction(async (transactionalEntityManager) => {
      const payment = await transactionalEntityManager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${paymentId} no encontrado`);
      }
      return await this.markAsApprovedInternal(payment, details, transactionalEntityManager);
    });
  }

  /**
   * Transiciona un pago a FAILED
   */
  async markAsFailed(
    paymentId: string,
    details: Partial<Payment>,
    externalManager?: EntityManager,
  ): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;
    return await manager.transaction(async (transactionalEntityManager) => {
      const payment = await transactionalEntityManager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${paymentId} no encontrado`);
      }
      return await this.markAsFailedInternal(payment, details, transactionalEntityManager);
    });
  }

  /**
   * Transiciona un pago a CANCELLED
   */
  async markAsCancelled(paymentId: string, externalManager?: EntityManager): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;
    return await manager.transaction(async (transactionalEntityManager) => {
      const payment = await transactionalEntityManager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${paymentId} no encontrado`);
      }

      this.validateTransition(payment.status, PaymentStatus.CANCELLED);

      payment.status = PaymentStatus.CANCELLED;

      return await transactionalEntityManager.save(Payment, payment);
    });
  }

  /**
   * Transiciona un pago a REFUNDED
   */
  async markAsRefunded(paymentId: string, externalManager?: EntityManager): Promise<Payment> {
    const manager = externalManager || this.paymentRepository.manager;
    return await manager.transaction(async (transactionalEntityManager) => {
      const payment = await transactionalEntityManager.findOne(Payment, {
        where: { id: paymentId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${paymentId} no encontrado`);
      }

      this.validateTransition(payment.status, PaymentStatus.REFUNDED);

      payment.status = PaymentStatus.REFUNDED;
      payment.refundedAt = new Date();

      return await transactionalEntityManager.save(Payment, payment);
    });
  }

  /**
   * Obtiene un pago por ID
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }
    return payment;
  }

  // --- MÉTODOS INTERNOS Y MÁQUINA DE ESTADOS ---

  private async markAsApprovedInternal(
    payment: Payment,
    details: Partial<Payment>,
    manager: EntityManager,
  ): Promise<Payment> {
    this.validateTransition(payment.status, PaymentStatus.APPROVED);

    payment.status = PaymentStatus.APPROVED;
    payment.approvedAt = new Date();

    // Actualizar metadatos de tarjeta/transacción seguros
    if (details.cardLastFour) payment.cardLastFour = details.cardLastFour;
    if (details.cardBrand) payment.cardBrand = details.cardBrand;
    if (details.transactionId) payment.transactionId = details.transactionId;
    if (details.externalReference) payment.externalReference = details.externalReference;
    if (details.responseCode) payment.responseCode = details.responseCode;

    return await manager.save(Payment, payment);
  }

  private async markAsFailedInternal(
    payment: Payment,
    details: Partial<Payment>,
    manager: EntityManager,
  ): Promise<Payment> {
    this.validateTransition(payment.status, PaymentStatus.FAILED);

    payment.status = PaymentStatus.FAILED;
    payment.failedAt = new Date();

    if (details.responseCode) payment.responseCode = details.responseCode;
    if (details.transactionId) payment.transactionId = details.transactionId;
    if (details.externalReference) payment.externalReference = details.externalReference;

    return await manager.save(Payment, payment);
  }

  /**
   * Control estricto de transiciones de estados de pago.
   */
  private validateTransition(current: PaymentStatus, target: PaymentStatus): void {
    if (current === target) return;

    // Regla de cancelación o falla solo permitida desde PENDING
    if (target === PaymentStatus.CANCELLED && current !== PaymentStatus.PENDING) {
      throw new BadRequestException(`No se puede cancelar el pago desde el estado ${current}`);
    }

    if (target === PaymentStatus.FAILED && current !== PaymentStatus.PENDING) {
      throw new BadRequestException(`No se puede fallar el pago desde el estado ${current}`);
    }

    if (target === PaymentStatus.APPROVED && current !== PaymentStatus.PENDING) {
      throw new BadRequestException(`No se puede aprobar el pago desde el estado ${current}`);
    }

    // Un reembolso solo es válido si el pago ya fue APPROVED
    if (target === PaymentStatus.REFUNDED && current !== PaymentStatus.APPROVED) {
      throw new BadRequestException(`No se puede reembolsar el pago desde el estado ${current}. Primero debe estar APROBADO.`);
    }

    // Impedir cualquier transición desde estados terminales (FAILED, CANCELLED, REFUNDED)
    const terminalStates = [PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.REFUNDED];
    if (terminalStates.includes(current)) {
      throw new BadRequestException(`El pago se encuentra en un estado terminal (${current}) y no se puede modificar.`);
    }
  }
}
