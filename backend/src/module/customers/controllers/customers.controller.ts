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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CustomersService } from '../customers.service';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '../dto/update-customer-address.dto';
import { CustomerProfileResponseDto } from '../dto/customer-profile-response.dto';
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
    summary: 'Obtener las direcciones registradas del cliente autenticado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me/addresses')
  async getMyAddresses(@CurrentCustomer() customer: CurrentCustomerPayload) {
    const addresses = await this.customersService.getAddresses(customer.id);

    const formattedAddresses = addresses.map((addr) => ({
      id: addr.id,
      department: addr.department
        ? {
            id: addr.department.id,
            name: addr.department.name,
          }
        : null,
      district: addr.district
        ? {
            id: addr.district.id,
            name: addr.district.name,
          }
        : null,
      city: addr.city,
      addressLine: addr.addressLine,
      label: addr.label,
      isDefault: addr.isDefault,
    }));

    return {
      success: true,
      data: formattedAddresses,
    };
  }

  @ApiOperation({
    summary: 'Registrar una nueva dirección para el cliente autenticado',
  })
  @ApiBody({ type: CreateCustomerAddressDto })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Post('me/addresses')
  async createAddress(
    @Body() dto: CreateCustomerAddressDto,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.createAddress(customer.id, dto);

    const formattedAddress = {
      id: address.id,
      department: address.department
        ? {
            id: address.department.id,
            name: address.department.name,
          }
        : null,
      district: address.district
        ? {
            id: address.district.id,
            name: address.district.name,
          }
        : null,
      city: address.city,
      addressLine: address.addressLine,
      label: address.label,
      isDefault: address.isDefault,
    };

    return {
      success: true,
      data: formattedAddress,
    };
  }

  @ApiOperation({
    summary: 'Actualizar una dirección existente del cliente autenticado',
  })
  @ApiBody({ type: UpdateCustomerAddressDto })
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

    const formattedAddress = {
      id: address.id,
      department: address.department
        ? {
            id: address.department.id,
            name: address.department.name,
          }
        : null,
      district: address.district
        ? {
            id: address.district.id,
            name: address.district.name,
          }
        : null,
      city: address.city,
      addressLine: address.addressLine,
      label: address.label,
      isDefault: address.isDefault,
    };

    return {
      success: true,
      data: formattedAddress,
    };
  }

  @ApiOperation({
    summary: 'Eliminar una dirección del cliente autenticado',
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
    await this.customersService.removeAddress(customer.id, id);
    return {
      success: true,
      message: 'Dirección eliminada correctamente.',
    };
  }

  @ApiOperation({
    summary:
      'Establecer una dirección como principal para el cliente autenticado',
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

    const formattedAddress = {
      id: address.id,
      department: address.department
        ? {
            id: address.department.id,
            name: address.department.name,
          }
        : null,
      district: address.district
        ? {
            id: address.district.id,
            name: address.district.name,
          }
        : null,
      city: address.city,
      addressLine: address.addressLine,
      label: address.label,
      isDefault: address.isDefault,
    };

    return {
      success: true,
      data: formattedAddress,
    };
  }
}
