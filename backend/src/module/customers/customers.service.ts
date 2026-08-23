import { Injectable, ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   * Helper to normalize email before checking.
   */
  private normalizeEmail(email: string): string {
    return email ? email.trim().toLowerCase() : '';
  }

  /**
   * Helper to normalize DUI before checking.
   */
  private normalizeDui(dui: string): string {
    if (!dui) return '';
    let cleaned = dui.replace(/[^\d]/g, '');
    if (cleaned.length === 9) {
      cleaned = `${cleaned.substring(0, 8)}-${cleaned.charAt(8)}`;
    }
    return cleaned;
  }

  /**
   * Validates email and DUI uniqueness for active customers.
   * If any exists, throws ConflictException with a specific business code.
   */
  async validateUniqueness(
    email: string,
    dui: string,
    excludeId?: string,
  ): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedDui = this.normalizeDui(dui);

    // 1. Check active email uniqueness
    if (normalizedEmail) {
      const emailQuery = this.customerRepository
        .createQueryBuilder('customer')
        .where('LOWER(customer.email) = :email', { email: normalizedEmail })
        .andWhere('customer.deleted_at IS NULL');

      if (excludeId) {
        emailQuery.andWhere('customer.id != :excludeId', { excludeId });
      }

      const emailExists = await emailQuery.getOne();
      if (emailExists) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'El correo electrónico ya está registrado por otro cliente activo',
          details: { email: normalizedEmail },
        });
      }
    }

    // 2. Check active DUI uniqueness
    if (normalizedDui) {
      const duiQuery = this.customerRepository
        .createQueryBuilder('customer')
        .where('customer.dui = :dui', { dui: normalizedDui })
        .andWhere('customer.deleted_at IS NULL');

      if (excludeId) {
        duiQuery.andWhere('customer.id != :excludeId', { excludeId });
      }

      const duiExists = await duiQuery.getOne();
      if (duiExists) {
        throw new ConflictException({
          code: 'DUI_ALREADY_EXISTS',
          message: 'El DUI ya está registrado por otro cliente activo',
          details: { dui: normalizedDui },
        });
      }
    }
  }

  /**
   * Crea un nuevo cliente validando unicidad a nivel de negocio.
   */
  async create(data: Partial<Customer>): Promise<Customer> {
    await this.validateUniqueness(data.email || '', data.dui || '');

    if (data.totalSpent !== undefined && data.totalSpent < 0) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TOTAL_SPENT',
        message: 'El total gastado (totalSpent) no puede ser menor que cero',
      });
    }

    if (data.totalOrders !== undefined && data.totalOrders < 0) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TOTAL_ORDERS',
        message: 'El total de órdenes (totalOrders) no puede ser menor que cero',
      });
    }

    const customer = this.customerRepository.create(data);
    return await this.customerRepository.save(customer);
  }

  /**
   * Actualiza un cliente validando unicidad a nivel de negocio.
   */
  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: `No se encontró el cliente con id ${id}`,
      });
    }

    const emailToCheck = data.email !== undefined ? data.email : customer.email;
    const duiToCheck = data.dui !== undefined ? data.dui : customer.dui;
    await this.validateUniqueness(emailToCheck, duiToCheck, id);

    const totalSpentToCheck = data.totalSpent !== undefined ? data.totalSpent : customer.totalSpent;
    const totalOrdersToCheck = data.totalOrders !== undefined ? data.totalOrders : customer.totalOrders;

    if (totalSpentToCheck < 0) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TOTAL_SPENT',
        message: 'El total gastado (totalSpent) no puede ser menor que cero',
      });
    }

    if (totalOrdersToCheck < 0) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TOTAL_ORDERS',
        message: 'El total de órdenes (totalOrders) no puede ser menor que cero',
      });
    }

    Object.assign(customer, data);
    return await this.customerRepository.save(customer);
  }

  /**
   * Busca todos los clientes activos.
   */
  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find();
  }

  /**
   * Busca un cliente por id.
   */
  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: `No se encontró el cliente con id ${id}`,
      });
    }
    return customer;
  }
}
