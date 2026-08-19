import { Controller, Get, Post, Patch, Delete, HttpCode, HttpStatus, Body, Query, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SuppliersService } from './suppliers.service';
import { SupplierQueryDto } from './dto/supplier-query.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions('suppliers:read')
  @ApiOperation({
    summary: 'Obtener lista paginada de proveedores con búsqueda opcional',
    description: 'Devuelve una lista paginada de proveedores ordenados por fecha de creación descensional. Permite filtrar por nombre o contacto de manera case-insensitive.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página a consultar' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Cantidad de registros por página' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Término de búsqueda case-insensitive sobre el nombre o persona de contacto' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de proveedores retornada con éxito',
    schema: {
      example: {
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Distribuidora San Salvador S.A.',
            contactName: 'Juan Pérez',
            phone: '+50375943334',
            email: 'contacto@sansalvador.sv',
            address: 'Calle Principal #123, San Salvador',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Parámetros de consulta o paginación inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario sin el permiso "suppliers:read"',
  })
  async findAll(@Query() queryDto: SupplierQueryDto) {
    const result = await this.suppliersService.findAll(queryDto);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @Permissions('suppliers:read')
  @ApiOperation({
    summary: 'Obtener el detalle completo de un proveedor por ID',
    description: 'Retorna los datos de un proveedor específico identificado por su UUID v4. Retorna 404 si no existe o fue eliminado por soft delete.',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 del proveedor', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del proveedor retornado con éxito',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de UUID inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario sin el permiso "suppliers:read"',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no encontrado o eliminado (soft delete)',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SupplierResponseDto> {
    return await this.suppliersService.findOne(id);
  }

  @Post()
  @Permissions('suppliers:create')
  @ApiOperation({
    summary: 'Crear un nuevo proveedor',
    description: 'Registra un nuevo proveedor en el sistema. Valida la unicidad del nombre de forma case-insensitive y normaliza el número telefónico para El Salvador (+503).',
  })
  @ApiBody({ type: CreateSupplierDto, description: 'Datos del nuevo proveedor a crear' })
  @ApiResponse({
    status: 201,
    description: 'Proveedor creado exitosamente',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Petición inválida o errores de sintaxis en el cuerpo JSON',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario sin el permiso "suppliers:create"',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: Ya existe un proveedor registrado con ese mismo nombre (case-insensitive)',
  })
  @ApiResponse({
    status: 422,
    description: 'Error de validación en los campos del cuerpo DTO (ej. nombre corto, email o teléfono inválido)',
    schema: {
      example: {
        statusCode: 422,
        message: ['name must be longer than or equal to 2 characters', 'phone must be a valid phone number'],
        error: 'Unprocessable Entity',
      },
    },
  })
  async create(@Body() createSupplierDto: CreateSupplierDto): Promise<SupplierResponseDto> {
    return await this.suppliersService.create(createSupplierDto);
  }

  @Patch(':id')
  @Permissions('suppliers:update')
  @ApiOperation({
    summary: 'Actualizar parcialmente los datos de un proveedor',
    description: 'Modifica uno o varios campos de un proveedor existente. Si se actualiza el nombre, se valida la unicidad. Si se modifica el teléfono, se aplica la normalización (+503).',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 del proveedor a actualizar', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateSupplierDto, description: 'Campos del proveedor a modificar parcialmente' })
  @ApiResponse({
    status: 200,
    description: 'Proveedor actualizado exitosamente',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de UUID inválido o error en la petición',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario sin el permiso "suppliers:update"',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no encontrado o eliminado (soft delete)',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: Ya existe otro proveedor con el nombre especificado',
  })
  @ApiResponse({
    status: 422,
    description: 'Error de validación en los datos de entrada del DTO',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return await this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Permissions('suppliers:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un proveedor (soft delete) por ID',
    description: 'Aplica eliminación lógica marcando la fecha en "deleted_at". Bloquea la eliminación respondiendo 409 si el proveedor tiene compras en estado PENDIENTE o RECIBIDA.',
  })
  @ApiParam({ name: 'id', description: 'UUID v4 del proveedor a eliminar', type: String, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 204,
    description: 'Proveedor eliminado exitosamente (sin contenido en la respuesta)',
  })
  @ApiResponse({
    status: 400,
    description: 'Formato de UUID inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso prohibido: usuario sin el permiso "suppliers:delete"',
  })
  @ApiResponse({
    status: 404,
    description: 'Proveedor no encontrado o ya eliminado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto: No se puede eliminar el proveedor porque tiene compras activas en estado Pendiente o Recibida',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.suppliersService.remove(id);
  }
}
