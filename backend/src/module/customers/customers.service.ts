import { Injectable, ConflictException, NotFoundException, UnprocessableEntityException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { LocationsService } from '../locations/locations.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
    private readonly locationsService: LocationsService,
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

  /**
   * Crea una dirección asociada a un cliente, validando el par department-district.
   */
  async createAddress(customerId: string, data: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const customer = await this.findOne(customerId);

    if (!data.departmentId || !data.districtId) {
      throw new BadRequestException('departmentId y districtId son requeridos');
    }

    // Validar el par departamento-distrito usando LocationsService
    await this.locationsService.validateDepartmentDistrict(
      data.departmentId,
      data.districtId,
    );

    const address = this.addressRepository.create({
      ...data,
      customerId: customer.id,
    });
    return await this.addressRepository.save(address);
  }

  /**
   * Actualiza una dirección existente validando el par department-district si cambia.
   */
  async updateAddress(
    customerId: string,
    addressId: string,
    data: Partial<CustomerAddress>,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: `No se encontró la dirección con id ${addressId} para el cliente`,
      });
    }

    const deptId = data.departmentId !== undefined ? data.departmentId : address.departmentId;
    const distId = data.districtId !== undefined ? data.districtId : address.districtId;

    if (data.departmentId !== undefined || data.districtId !== undefined) {
      // Re-validar par departamento-distrito si uno de ellos cambia
      await this.locationsService.validateDepartmentDistrict(deptId, distId);
    }

    Object.assign(address, data);
    return await this.addressRepository.save(address);
  }

  /**
   * Establece una dirección como principal dentro de una transacción.
   */
  async setDefaultAddress(customerId: string, addressId: string): Promise<CustomerAddress> {
    // 1. Validar que la dirección solicitada exista, pertenezca al cliente y no esté eliminada.
    const targetAddress = await this.addressRepository.findOne({
      where: { id: addressId, customerId },
    });

    if (!targetAddress) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: `No se encontró la dirección con id ${addressId} para el cliente`,
      });
    }

    // 2. Ejecutar dentro de una transacción para asegurar consistencia
    return await this.customerRepository.manager.transaction(async (transactionalEntityManager) => {
      // Desmarcar la dirección principal actual
      await transactionalEntityManager.update(
        CustomerAddress,
        { customerId, isDefault: true, deletedAt: null },
        { isDefault: false },
      );

      // Marcar la nueva dirección como principal
      targetAddress.isDefault = true;
      return await transactionalEntityManager.save(targetAddress);
    });
  }

  /**
   * Elimina una dirección utilizando soft delete. Si era la dirección principal,
   * reasigna automáticamente otra dirección activa del cliente como principal.
   */
  async removeAddress(customerId: string, addressId: string): Promise<void> {
    // 1. Validar que la dirección pertenezca al cliente solicitado antes de eliminarla.
    const address = await this.addressRepository.findOne({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: `No se encontró la dirección con id ${addressId} para el cliente`,
      });
    }

    // 2. Ejecutar la operación dentro de una transacción.
    await this.customerRepository.manager.transaction(async (transactionalEntityManager) => {
      // Marcar la dirección como eliminada (soft delete)
      await transactionalEntityManager.softDelete(CustomerAddress, addressId);

      // Si la dirección eliminada era la principal, reasignar otra dirección activa
      if (address.isDefault) {
        const remainingAddress = await transactionalEntityManager.findOne(CustomerAddress, {
          where: { customerId }, // TypeORM aplica el filtro WHERE deleted_at IS NULL automáticamente
          order: { createdAt: 'ASC' },
        });

        if (remainingAddress) {
          remainingAddress.isDefault = true;
          await transactionalEntityManager.save(CustomerAddress, remainingAddress);
        }
      }
    });
  }
}
