import { Injectable, ConflictException, NotFoundException, UnprocessableEntityException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository, EntityManager } from 'typeorm';
import { Response } from 'express';
import { Customer } from './entities/customer.entity';
import { CustomerAddress } from './entities/customer-address.entity';
import { EcommerceAuthSession } from './entities/ecommerce-auth-session.entity';
import { Order } from '../orders/entities/order.entity';
import { LocationsService } from '../locations/locations.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashService } from '../auth/services/hash.service';
import { EcommerceRegisterDto } from './dto/ecommerce-register.dto';
import {
  SESSION_ABSOLUTE_MAX_TTL_SECONDS,
  COOKIE_TTL_SHORT,
  COOKIE_TTL_LONG_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  buildRefreshTokenCookieOptions,
  hashToken,
} from './constants/ecommerce-auth.constant';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
    @InjectRepository(EcommerceAuthSession)
    private readonly sessionRepository: Repository<EcommerceAuthSession>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly locationsService: LocationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashService: HashService,
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

    if (data.totalSpent !== undefined && Number(data.totalSpent) < 0) {
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
   * Registro transaccional de un nuevo cliente comprador (Customer + dirección principal + sesión de autenticación).
   */
  async register(
    dto: EcommerceRegisterDto,
    userAgent?: string,
    ipHash?: string,
  ): Promise<{
    customer: Customer;
    accessToken: string;
    rawRefreshToken: string;
    cookieMaxAge: number | undefined;
  }> {
    // 1. Normalizar y validar unicidad de email y DUI
    await this.validateUniqueness(dto.email, dto.dui);

    // 2. Validar que el par departamento-distrito sea válido
    await this.locationsService.validateDepartmentDistrict(dto.departmentId, dto.districtId);

    // 3. Hashear la contraseña utilizando HashService
    const hashedPassword = await this.hashService.hashPassword(dto.password);

    // 4. Ejecutar la creación en una transacción única de base de datos
    return await this.customerRepository.manager.transaction(async (manager) => {
      const customer = manager.create(Customer, {
        fullName: dto.fullName,
        email: dto.email,
        dui: dto.dui,
        phone: dto.phone,
        passwordHash: hashedPassword,
        isActive: true,
        totalSpent: 0,
        totalOrders: 0,
        lastOrderAt: null,
      });

      const savedCustomer = await manager.save(Customer, customer);

      // Crear dirección principal (isDefault = true, label = 'Casa')
      const address = manager.create(CustomerAddress, {
        customerId: savedCustomer.id,
        departmentId: dto.departmentId,
        districtId: dto.districtId,
        city: dto.city || null,
        addressLine: dto.addressLine,
        label: 'Casa',
        isDefault: true,
      });

      await manager.save(CustomerAddress, address);

      // Crear sesión de autenticación en la misma transacción
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        this.configService.get<string>('JWT_SECRET') ||
        'default_secret';

      const rawRefreshToken = await this.jwtService.signAsync(
        { sub: savedCustomer.id, type: 'refresh' },
        { secret: refreshSecret, expiresIn: SESSION_ABSOLUTE_MAX_TTL_SECONDS },
      );

      const tokenHash = hashToken(rawRefreshToken);
      const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MAX_TTL_SECONDS * 1000);

      const session = manager.create(EcommerceAuthSession, {
        customerId: savedCustomer.id,
        refreshTokenHash: tokenHash,
        expiresAt,
        revokedAt: null,
        lastUsedAt: null,
        userAgent: userAgent || null,
        ipHash: ipHash || null,
      });

      await manager.save(EcommerceAuthSession, session);

      // Generar el Access Token con duración fija de 15 minutos (900s)
      const accessToken = await this.generateAccessToken(savedCustomer);

      // rememberMe es false por defecto en el registro
      const cookieMaxAge = COOKIE_TTL_SHORT;

      return {
        customer: savedCustomer,
        accessToken,
        rawRefreshToken,
        cookieMaxAge,
      };
    });
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

    if (Number(totalSpentToCheck) < 0) {
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
      relations: ['addresses', 'addresses.department', 'addresses.district'],
    });
    if (!customer) {
      throw new NotFoundException({
        code: 'CUSTOMER_NOT_FOUND',
        message: 'El cliente solicitado no existe',
      });
    }
    if (customer.addresses) {
      customer.addresses.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    }
    return customer;
  }

  /**
   * Obtiene todas las direcciones de un cliente, ordenadas de forma consistente (predeterminada primero).
   */
  async getAddresses(customerId: string): Promise<CustomerAddress[]> {
    return await this.addressRepository.find({
      where: { customerId },
      relations: ['department', 'district'],
      order: {
        isDefault: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Desmarca la dirección principal activa anterior para el cliente en el manager dado.
   */
  private async clearDefaultAddress(manager: EntityManager, customerId: string): Promise<void> {
    await manager.update(
      CustomerAddress,
      { customerId, isDefault: true, deletedAt: IsNull() },
      { isDefault: false },
    );
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

    return await this.customerRepository.manager.transaction(async (manager) => {
      // Contar direcciones activas (no borradas)
      const activeAddressCount = await manager.count(CustomerAddress, {
        where: { customerId, deletedAt: IsNull() },
      });

      // Si es la primera dirección activa o el DTO solicita isDefault = true, marcar como principal
      const isDefault = activeAddressCount === 0 || data.isDefault === true;

      if (isDefault) {
        // Desmarcar principal anterior
        await this.clearDefaultAddress(manager, customerId);
      }

      const address = manager.create(CustomerAddress, {
        ...data,
        customerId: customer.id,
        isDefault,
      });

      const savedAddress = await manager.save(CustomerAddress, address);

      // Recargar con relaciones
      return (await manager.findOne(CustomerAddress, {
        where: { id: savedAddress.id },
        relations: ['department', 'district'],
      }))!;
    });
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

    return await this.customerRepository.manager.transaction(async (manager) => {
      // Si cambia a isDefault = true
      if (data.isDefault === true) {
        await this.clearDefaultAddress(manager, customerId);
      }

      Object.assign(address, data);
      const saved = await manager.save(CustomerAddress, address);

      return (await manager.findOne(CustomerAddress, {
        where: { id: saved.id },
        relations: ['department', 'district'],
      }))!;
    });
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
      await this.clearDefaultAddress(transactionalEntityManager, customerId);

      // Marcar la nueva dirección como principal
      targetAddress.isDefault = true;
      const saved = await transactionalEntityManager.save(targetAddress);

      return (await transactionalEntityManager.findOne(CustomerAddress, {
        where: { id: saved.id },
        relations: ['department', 'district'],
      }))!;
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

  /**
   * Genera el access token JWT para un cliente con duración fija de 900 segundos (15 minutos).
   */
  async generateAccessToken(customer: Customer): Promise<string> {
    const payload = {
      sub: customer.id,
      email: customer.email,
      role: 'CUSTOMER',
      type: 'access',
    };

    const secret = this.configService.get<string>('JWT_SECRET') || 'default_secret';
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: 900,
    });
  }

  /**
   * Genera un refresh token JWT, calcula su hash y lo persiste como sesión en BD.
   * La sesión siempre expira a las 24 horas desde su creación (duración absoluta máxima).
   * rememberMe solo controla si la cookie persiste al cerrar el navegador.
   *
   * @param customerId - ID del cliente.
   * @param rememberMe - Si es true, la cookie persiste 24h en el navegador; si es false, es cookie de sesión.
   * @param userAgent - User-Agent de la petición (informativo).
   * @param ipHash - Hash SHA-256 de la IP del cliente.
   * @returns El refresh token en texto plano y la configuración de cookie.
   */
  async issueRefreshToken(
    customerId: string,
    rememberMe: boolean,
    userAgent?: string,
    ipHash?: string,
  ): Promise<{ rawToken: string; cookieMaxAge: number | undefined }> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default_secret';

    // El JWT del refresh token expira a las 24 horas (duración absoluta máxima de la sesión)
    const rawToken = await this.jwtService.signAsync(
      { sub: customerId, type: 'refresh' },
      { secret: refreshSecret, expiresIn: SESSION_ABSOLUTE_MAX_TTL_SECONDS },
    );

    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_ABSOLUTE_MAX_TTL_SECONDS * 1000);

    const session = this.sessionRepository.create({
      customerId,
      refreshTokenHash: tokenHash,
      expiresAt,
      revokedAt: null,
      lastUsedAt: null,
      userAgent: userAgent || null,
      ipHash: ipHash || null,
    });
    await this.sessionRepository.save(session);

    // rememberMe solo controla la persistencia de la cookie en el navegador
    const cookieMaxAge = rememberMe ? COOKIE_TTL_LONG_SECONDS : COOKIE_TTL_SHORT;
    return { rawToken, cookieMaxAge };
  }

  /**
   * Valida que una sesión sea elegible para refresh.
   * - La sesión debe existir.
   * - No debe estar revocada.
   * - No debe haber superado su duración absoluta máxima (expiresAt).
   *
   * @returns La sesión válida si pasa todas las verificaciones.
   */
  async validateSessionForRefresh(refreshToken: string): Promise<EcommerceAuthSession> {
    const tokenHash = hashToken(refreshToken);

    const session = await this.sessionRepository.findOne({
      where: { refreshTokenHash: tokenHash, revokedAt: IsNull() },
    });

    if (!session) {
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
      });
    }

    // Verificar duración absoluta máxima de 24 horas
    if (new Date() >= session.expiresAt) {
      // Revocar la sesión expirada
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);

      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
      });
    }

    return session;
  }
  /**
   * Rota el refresh token de una sesión existente.
   * - Valida la sesión (existencia, revocación, expiración absoluta).
   * - Genera un nuevo refresh token JWT.
   * - Actualiza refreshTokenHash y lastUsedAt en la sesión existente.
   * - NO extiende expiresAt (respeta la duración absoluta máxima de 24h).
   * - El token original queda inutilizable tras la rotación.
   *
   * @returns Nuevo token en texto plano y tiempo restante de la sesión para la cookie.
   */
  async rotateRefreshToken(
    currentRefreshToken: string,
    rememberMe: boolean,
  ): Promise<{ rawToken: string; cookieMaxAge: number | undefined; customerId: string }> {
    // 1. Validar la sesión actual
    const session = await this.validateSessionForRefresh(currentRefreshToken);

    // 2. Calcular el tiempo restante de la sesión (no extender más allá de expiresAt)
    const remainingMs = session.expiresAt.getTime() - Date.now();
    const remainingSeconds = Math.max(Math.floor(remainingMs / 1000), 0);

    if (remainingSeconds <= 0) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
      });
    }

    // 3. Generar un nuevo refresh token con el tiempo restante de la sesión
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default_secret';

    const rawToken = await this.jwtService.signAsync(
      { sub: session.customerId, type: 'refresh' },
      { secret: refreshSecret, expiresIn: remainingSeconds },
    );

    // 4. Actualizar solo el hash y lastUsedAt, sin modificar expiresAt
    session.refreshTokenHash = hashToken(rawToken);
    session.lastUsedAt = new Date();
    await this.sessionRepository.save(session);

    // 5. Cookie: rememberMe controla persistencia, pero maxAge no excede el tiempo restante
    const cookieMaxAge = rememberMe
      ? Math.min(COOKIE_TTL_LONG_SECONDS!, remainingSeconds)
      : COOKIE_TTL_SHORT;

    return { rawToken, cookieMaxAge, customerId: session.customerId };
  }

  /**
   * Revoca una sesión específica marcando revokedAt.
   * Útil para logout o invalidación por compromiso de seguridad.
   */
  async revokeSession(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const session = await this.sessionRepository.findOne({
      where: { refreshTokenHash: tokenHash, revokedAt: IsNull() },
    });

    if (session) {
      session.revokedAt = new Date();
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Revoca todas las sesiones activas de un cliente.
   * Útil para cambio de contraseña, compromiso de cuenta o cierre de sesión global.
   */
  async revokeAllCustomerSessions(customerId: string): Promise<void> {
    await this.sessionRepository.update(
      { customerId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  /**
   * Configura la cookie segura del refresh token en la respuesta HTTP.
   */
  setRefreshTokenCookie(res: Response, rawToken: string, cookieMaxAge: number | undefined): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieOptions = buildRefreshTokenCookieOptions(cookieMaxAge, isProduction);
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawToken, cookieOptions);
  }

  /**
   * Limpia la cookie del refresh token (útil para logout).
   */
  clearRefreshTokenCookie(res: Response): void {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/v1/ecommerce/auth',
      secure: isProduction,
    });
  }

  /**
   * Valida las credenciales de inicio de sesión de un cliente comprador.
   */
  async validateCredentials(email: string, password: string): Promise<Customer> {
    const normalizedEmail = this.normalizeEmail(email);
    const customer = await this.customerRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!customer) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Las credenciales proporcionadas no son válidas',
      });
    }

    if (!customer.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Las credenciales proporcionadas no son válidas',
      });
    }

    const isPasswordValid = await this.hashService.comparePassword(password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Las credenciales proporcionadas no son válidas',
      });
    }

    return customer;
  }

  /**
   * Obtiene la lista de clientes con paginación, filtros de búsqueda y ordenación.
   * Exclusivo para administradores/backoffice.
   */
  async findAllForAdmin(
    page: number = 1,
    limit: number = 10,
    filters?: {
      search?: string;
      isActive?: boolean;
      lastOrderFrom?: Date;
      lastOrderTo?: Date;
      sortBy?: string;
      order?: 'ASC' | 'DESC';
    },
  ) {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    if (filters) {
      if (filters.search) {
        const normalizedSearch = filters.search.trim();
        queryBuilder.andWhere(
          '(customer.fullName ILIKE :search OR customer.email ILIKE :search)',
          { search: `%${normalizedSearch}%` },
        );
      }
      if (filters.isActive !== undefined) {
        queryBuilder.andWhere('customer.isActive = :isActive', { isActive: filters.isActive });
      }

      // Validar coherencia del rango de fecha de última orden
      if (filters.lastOrderFrom && filters.lastOrderTo && filters.lastOrderFrom > filters.lastOrderTo) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'La fecha de inicio (lastOrderFrom) no puede ser posterior a la fecha de fin (lastOrderTo)',
        });
      }

      if (filters.lastOrderFrom) {
        queryBuilder.andWhere('customer.lastOrderAt >= :lastOrderFrom', {
          lastOrderFrom: filters.lastOrderFrom,
        });
      }
      if (filters.lastOrderTo) {
        queryBuilder.andWhere('customer.lastOrderAt <= :lastOrderTo', {
          lastOrderTo: filters.lastOrderTo,
        });
      }
    }

    queryBuilder.andWhere('customer.deletedAt IS NULL');

    // Mapeo seguro mediante lista blanca
    const sortByWhitelist: Record<string, string> = {
      fullName: 'customer.fullName',
      lastOrderAt: 'customer.lastOrderAt',
      totalSpent: 'customer.totalSpent',
      totalOrders: 'customer.totalOrders',
    };

    const sortColumn = (filters && filters.sortBy && sortByWhitelist[filters.sortBy]) || 'customer.createdAt';
    const sortOrder = (filters && filters.order) || 'DESC';

    queryBuilder.orderBy(sortColumn, sortOrder);
    queryBuilder.addOrderBy('customer.id', 'ASC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [customers, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      customers,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Obtiene el historial de pedidos de un cliente con paginación.
   */
  async findOrdersForCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    await this.findOne(customerId);

    const queryBuilder = this.orderRepository.createQueryBuilder('order');
    queryBuilder.where('order.customerId = :customerId', { customerId });
    queryBuilder.orderBy('order.createdAt', 'DESC');
    queryBuilder.addOrderBy('order.id', 'ASC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [orders, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
}
