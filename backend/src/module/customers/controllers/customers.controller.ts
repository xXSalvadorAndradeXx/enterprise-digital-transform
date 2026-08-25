import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from '../customers.service';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { CreateCustomerAddressDto } from '../dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from '../dto/update-customer-address.dto';

@ApiTags('Customers Addresses')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({
    summary: 'Obtener las direcciones registradas del cliente autenticado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me/addresses')
  async getMyAddresses(@Req() req: any) {
    const addresses = await this.customersService.getAddresses(req.user.id);

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
    @Req() req: any,
  ) {
    const address = await this.customersService.createAddress(req.user.id, dto);

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
    @Req() req: any,
  ) {
    const address = await this.customersService.updateAddress(req.user.id, id, dto);

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
    @Req() req: any,
  ) {
    await this.customersService.removeAddress(req.user.id, id);
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
    @Req() req: any,
  ) {
    const address = await this.customersService.setDefaultAddress(req.user.id, id);

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
