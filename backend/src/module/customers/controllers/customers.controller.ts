import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
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
      'Retorna los datos esenciales del perfil del cliente actual para la pantalla de Cuenta, omitiendo métricas administrativas y relaciones completas.',
  })
  @ApiOkResponse({
    description: 'Perfil del cliente autenticado obtenido exitosamente',
    type: CustomerProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de acceso inválido, expirado o cuenta deshabilitada (ACCOUNT_DISABLED)',
  })
  @ApiNotFoundResponse({
    description: 'Cliente no encontrado (CUSTOMER_NOT_FOUND)',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me')
  async getMyProfile(@CurrentCustomer() customer: CurrentCustomerPayload) {
    const profile = await this.customersService.getMyProfile(customer.id, customer);
    return {
      success: true,
      data: profile,
    };
  }

  @ApiOperation({
    summary: 'Actualizar nombre y teléfono del cliente autenticado',
    description:
      'Actualiza exclusivamente name y phone garantizando ownership estricto por token JWT. Rechaza campos readonly.',
  })
  @ApiBody({ type: UpdateCustomerProfileDto })
  @ApiOkResponse({
    description: 'Perfil actualizado exitosamente',
    type: CustomerProfileResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Error de validación en los datos o envío de campos prohibidos (VALIDATION_ERROR)',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de acceso inválido, expirado o cuenta deshabilitada (ACCOUNT_DISABLED)',
  })
  @ApiNotFoundResponse({
    description: 'Cliente no encontrado (CUSTOMER_NOT_FOUND)',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @CurrentCustomer() customer: CurrentCustomerPayload,
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    const updatedProfile = await this.customersService.updateMyProfile(customer.id, dto);
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
    @Param('id', new ParseUUIDPipe({ version: '4', exceptionFactory: () => {
      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'El ID de la dirección debe ser un UUID versión 4 válido',
      });
    }}))
    id: string,
    @Body() dto: UpdateCustomerAddressDto,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.updateAddress(customer.id, id, dto);

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
    @Param('id', new ParseUUIDPipe({ version: '4', exceptionFactory: () => {
      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'El ID de la dirección debe ser un UUID versión 4 válido',
      });
    }}))
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
    summary: 'Establecer una dirección como principal para el cliente autenticado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Patch('me/addresses/:id/default')
  async setDefaultAddress(
    @Param('id', new ParseUUIDPipe({ version: '4', exceptionFactory: () => {
      return new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'El ID de la dirección debe ser un UUID versión 4 válido',
      });
    }}))
    id: string,
    @CurrentCustomer() customer: CurrentCustomerPayload,
  ) {
    const address = await this.customersService.setDefaultAddress(customer.id, id);

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
