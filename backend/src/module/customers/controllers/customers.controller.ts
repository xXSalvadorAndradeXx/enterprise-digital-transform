import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CustomersService } from '../customers.service';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '../dto/update-customer-address.dto';
import { CustomerProfileResponseDto } from '../dto/customer-profile-response.dto';
import {
  CustomerAddressResponseDto,
  CustomerAddressListResponseDto,
  SingleCustomerAddressResponseDto,
  DeleteCustomerAddressResponseDto,
} from '../dto/customer-address-response.dto';
import { UpdateCustomerProfileDto } from '../dto/update-customer-profile.dto';
import { CurrentCustomer } from '../decorators/current-customer.decorator';
import type { CurrentCustomerPayload } from '../decorators/current-customer.decorator';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({
    summary: 'Obtener el perfil del cliente autenticado',
    description:
      'Retorna los datos esenciales del perfil del cliente actual para la pantalla de Cuenta. ' +
      'El campo email es de estricta solo lectura (readonly). ' +
      'No expone métricas administrativas, credenciales ni relaciones completas.',
  })
  @ApiOkResponse({
    description: 'Perfil del cliente autenticado obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
            },
            name: { type: 'string', example: 'Carlos Eduardo Gómez' },
            fullName: { type: 'string', example: 'Carlos Eduardo Gómez' },
            email: {
              type: 'string',
              format: 'email',
              example: 'carlos.gomez@correo.com',
              description: 'Correo registrado (solo lectura)',
            },
            phone: {
              type: 'string',
              example: '+50371234567',
              description: 'Teléfono de contacto salvadoreño',
            },
            dui: {
              type: 'string',
              nullable: true,
              example: '01234567-8',
              description: 'DUI salvadoreño (solo lectura)',
            },
            role: { type: 'string', example: 'cliente' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-08-01T10:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Token de acceso ausente, inválido o expirado (UNAUTHORIZED / TOKEN_EXPIRED), o cuenta deshabilitada (ACCOUNT_DISABLED)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: {
              type: 'string',
              example: 'Acceso no autorizado. Token inválido o inexistente.',
            },
          },
        },
        timestamp: { type: 'string', example: '2026-09-07T18:00:00.000Z' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Cliente no encontrado (CUSTOMER_NOT_FOUND)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'CUSTOMER_NOT_FOUND' },
            message: {
              type: 'string',
              example:
                'No se encontró la cuenta del cliente asociada al token.',
            },
          },
        },
        timestamp: { type: 'string', example: '2026-09-07T18:00:00.000Z' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me')
  async getMyProfile(@CurrentCustomer() customer: CurrentCustomerPayload) {
    const profile = await this.customersService.getMyProfile(
      customer.id,
      customer,
    );
    return {
      success: true,
      data: profile,
    };
  }

  @ApiOperation({
    summary: 'Actualizar nombre y teléfono del cliente autenticado',
    description:
      'Actualiza exclusivamente los campos editables del perfil: name (o alias fullName) y phone, ' +
      'con estricto ownership derivado del token JWT. ' +
      'Campos de solo lectura (readonly): email, dui, id, role, isActive y métricas; ' +
      'estos campos están fuera del DTO y cualquier intento de modificación es ignorado o rechazado.',
  })
  @ApiBody({
    type: UpdateCustomerProfileDto,
    description:
      'Datos editables del perfil del cliente (únicamente name y phone)',
    examples: {
      actualizacionCompleta: {
        summary: 'Actualizar nombre y teléfono',
        value: {
          name: 'Carlos Eduardo Gómez',
          phone: '+50371234567',
        },
      },
      soloTelefono: {
        summary: 'Actualizar únicamente número de teléfono',
        value: {
          phone: '71234567',
        },
      },
      soloNombre: {
        summary: 'Actualizar únicamente nombre',
        value: {
          name: 'Carlos Gómez',
        },
      },
    },
  })
  @ApiOkResponse({
    description:
      'Perfil actualizado exitosamente. Retorna el perfil final para sincronización inmediata del Frontend.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Perfil actualizado correctamente.',
        },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1',
            },
            name: { type: 'string', example: 'Carlos Eduardo Gómez' },
            fullName: { type: 'string', example: 'Carlos Eduardo Gómez' },
            email: {
              type: 'string',
              format: 'email',
              example: 'carlos.gomez@correo.com',
              description: 'Correo persistido (solo lectura, sin mutación)',
            },
            phone: { type: 'string', example: '+50371234567' },
            dui: { type: 'string', nullable: true, example: '01234567-8' },
            role: { type: 'string', example: 'cliente' },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-08-01T10:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Error de validación en los datos (VALIDATION_ERROR). Por ejemplo: nombre vacío o teléfono salvadoreño inválido.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: {
              type: 'string',
              example: 'Los datos enviados no son válidos',
            },
            details: {
              type: 'array',
              items: { type: 'string' },
              example: [
                'El nombre no puede estar vacío ni compuesto únicamente por espacios',
              ],
            },
          },
        },
        timestamp: { type: 'string', example: '2026-09-07T18:00:00.000Z' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Token de acceso inválido, expirado o cuenta deshabilitada (UNAUTHORIZED / TOKEN_EXPIRED / ACCOUNT_DISABLED)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'UNAUTHORIZED' },
            message: {
              type: 'string',
              example: 'Acceso no autorizado. Token inválido o inexistente.',
            },
          },
        },
        timestamp: { type: 'string', example: '2026-09-07T18:00:00.000Z' },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Cliente no encontrado (CUSTOMER_NOT_FOUND)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'CUSTOMER_NOT_FOUND' },
            message: {
              type: 'string',
              example: 'No se encontró la cuenta de cliente a actualizar.',
            },
          },
        },
        timestamp: { type: 'string', example: '2026-09-07T18:00:00.000Z' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const updatedProfile = await this.customersService.updateMyProfile(
      customer.id,
      dto,
    );
    return {
      success: true,
      message: 'Perfil actualizado correctamente.',
      data: updatedProfile,
    };
  }

  @ApiOperation({
    summary: 'Obtener las direcciones registradas del cliente (Libreta y Checkout)',
    description:
      'Devuelve la lista de direcciones activas del cliente autenticado, ordenadas colocando siempre primero ' +
      'la dirección principal (isDefault = true). ' +
      'Contrato de Checkout: La pantalla de Checkout consume directamente este endpoint y selecciona la dirección ' +
      'con isDefault = true (o la primera posición data[0]) para autocompletar los datos de envío sin requerir ' +
      'un endpoint adicional. Si el arreglo retornado es vacío ([]), el Checkout solicita ingresar una nueva dirección.',
  })
  @ApiOkResponse({
    description: 'Listado de direcciones obtenido exitosamente para Libreta o Checkout',
    type: CustomerAddressListResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o expirado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me/addresses')
  async getMyAddresses(@CurrentCustomer() customer: CurrentCustomerPayload) {
    const addresses =
      await this.customersService.findAllByCustomer(customer.id);

    return {
      success: true,
      data: (addresses || []).map(CustomerAddressResponseDto.fromEntity),
    };
  }

  @ApiOperation({
    summary: 'Registrar una nueva dirección para el cliente autenticado',
    description:
      'Crea una nueva dirección validando que el par departamento-distrito exista y esté activo en el catálogo de Locations. ' +
      'Si es la primera dirección activa del cliente, se establece automáticamente como principal (isDefault = true). ' +
      'Si se envía isDefault = true, cualquier dirección principal previa se desmarca atómicamente en transacción. ' +
      'Garantizado por el índice único parcial en PostgreSQL (IDX_unique_default_address_per_customer).',
  })
  @ApiBody({ type: CreateCustomerAddressDto })
  @ApiCreatedResponse({
    description: 'Dirección registrada exitosamente',
    type: SingleCustomerAddressResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos en el cuerpo de la petición o par departamento-distrito no válido o inactivo (VALIDATION_ERROR / DEPARTMENT_NOT_FOUND / DISTRICT_NOT_FOUND)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o expirado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Post('me/addresses')
  @HttpCode(HttpStatus.CREATED)
  async createAddress(
    @Body() dto: CreateCustomerAddressDto,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.createAddress(customer.id, dto);

    return {
      success: true,
      message: 'Dirección registrada correctamente.',
      data: CustomerAddressResponseDto.fromEntity(address),
    };
  }

  @ApiOperation({
    summary: 'Actualizar una dirección existente del cliente autenticado',
    description:
      'Actualiza parcialmente los datos de una dirección propia del cliente autenticado (aislamiento multitenant). ' +
      'Revalida el par departamento-distrito con LocationsService únicamente si departmentId o districtId son modificados. ' +
      'Protege los campos inmutables (id, customerId, createdAt, updatedAt). ' +
      'Si se marca isDefault = true, desmarca la anterior en transacción. Si es la única dirección activa, retiene isDefault = true. ' +
      'Retorna la dirección completa poblada con nombres de ubicación para actualizar tarjetas en frontend sin recarga obligatoria.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador UUID v4 de la dirección a actualizar',
    example: '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60',
  })
  @ApiBody({ type: UpdateCustomerAddressDto })
  @ApiOkResponse({
    description: 'Dirección actualizada exitosamente con datos de ubicación cargados',
    type: SingleCustomerAddressResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El ID no es un UUID v4 válido o los datos enviados / catálogo geográfico no son válidos (VALIDATION_ERROR)',
  })
  @ApiNotFoundResponse({
    description:
      'La dirección no existe, está eliminada o no pertenece al cliente autenticado (ADDRESS_NOT_FOUND)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o expirado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Patch('me/addresses/:id')
  async updateAddress(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => {
          return new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID de la dirección debe ser un UUID versión 4 válido',
          });
        },
      }),
    )
    id: string,
    @Body() dto: UpdateCustomerAddressDto,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.updateAddress(
      customer.id,
      id,
      dto,
    );

    return {
      success: true,
      message: 'Dirección actualizada correctamente.',
      data: CustomerAddressResponseDto.fromEntity(address),
    };
  }

  @ApiOperation({
    summary: 'Eliminar una dirección del cliente autenticado y resolver default restante',
    description:
      'Realiza un borrado lógico (soft delete) de la dirección verificando ownership por customerId. ' +
      'Si no era principal, no altera otras direcciones. ' +
      'Si era la principal, reasigna automáticamente otra dirección activa restante con criterio determinístico ' +
      '(la más reciente: createdAt DESC, id ASC) dentro de la misma transacción. ' +
      'Si no quedan direcciones, permite cero defaults. ' +
      'Retorna deletedAddressId y newDefaultAddress para que el Frontend actualice su estado local sin recarga obligatoria.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador UUID v4 de la dirección a eliminar',
    example: '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60',
  })
  @ApiOkResponse({
    description: 'Dirección eliminada correctamente y default restante resuelta',
    type: DeleteCustomerAddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ID proporcionado no es un UUID versión 4 válido (VALIDATION_ERROR)',
  })
  @ApiNotFoundResponse({
    description:
      'La dirección no existe, ya fue eliminada o no pertenece al cliente autenticado (ADDRESS_NOT_FOUND)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o expirado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Delete('me/addresses/:id')
  async removeAddress(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => {
          return new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID de la dirección debe ser un UUID versión 4 válido',
          });
        },
      }),
    )
    id: string,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const result = await this.customersService.removeAddress(customer.id, id);
    return {
      success: true,
      message: 'Dirección eliminada correctamente.',
      data: {
        deletedAddressId: result.deletedAddressId,
        newDefaultAddress: result.newDefaultAddress
          ? CustomerAddressResponseDto.fromEntity(result.newDefaultAddress)
          : null,
      },
    };
  }

  @ApiOperation({
    summary: 'Establecer una dirección como principal de forma idempotente',
    description:
      'Establece la dirección indicada como predeterminada (isDefault = true) y desmarca atómicamente ' +
      'cualquier default previa dentro de una transacción. ' +
      'Es estrictamente idempotente: si la dirección ya era principal, retorna inmediatamente sin emitir escrituras ' +
      'innecesarias a la base de datos. Respeta el índice único parcial de PostgreSQL impidiendo duplicados. ' +
      'Permite al Frontend actualizar el check azul de selección de inmediato.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador UUID v4 de la dirección a marcar como principal',
    example: '7b2e8a1d-5c43-4f2e-9d8a-1b2c3d4e5f60',
  })
  @ApiOkResponse({
    description: 'Dirección establecida como principal exitosamente',
    type: SingleCustomerAddressResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ID proporcionado no es un UUID versión 4 válido (VALIDATION_ERROR)',
  })
  @ApiNotFoundResponse({
    description:
      'La dirección no existe, ya fue eliminada o no pertenece al cliente autenticado (ADDRESS_NOT_FOUND)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación inválido o expirado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Patch('me/addresses/:id/default')
  async setDefaultAddress(
    @Param(
      'id',
      new ParseUUIDPipe({
        version: '4',
        exceptionFactory: () => {
          return new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'El ID de la dirección debe ser un UUID versión 4 válido',
          });
        },
      }),
    )
    id: string,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.setDefaultAddress(
      customer.id,
      id,
    );

    return {
      success: true,
      message: 'Dirección predeterminada actualizada correctamente.',
      data: CustomerAddressResponseDto.fromEntity(address),
    };
  }
}
