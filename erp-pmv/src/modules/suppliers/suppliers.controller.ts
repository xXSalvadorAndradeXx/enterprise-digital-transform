// src/modules/suppliers/suppliers.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation, ApiQuery,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers:read')
  @ApiOperation({ summary: 'Lista proveedores con búsqueda y paginación' })
  findAll(@Query() query: QuerySupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('suppliers:read')
  @ApiOperation({ summary: 'Detalle de un proveedor' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Post()
  @RequirePermissions('suppliers:create')
  @ApiOperation({ summary: 'Crear proveedor' })
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('suppliers:update')
  @ApiOperation({ summary: 'Actualizar proveedor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('suppliers:update')
  @ApiOperation({ summary: 'Desactivar proveedor' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.deactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('suppliers:delete')
  @ApiOperation({ summary: 'Soft delete de proveedor' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }
}
