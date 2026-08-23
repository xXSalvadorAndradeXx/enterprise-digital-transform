// src/module/locations/locations.controller.ts
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { DistrictResponseDto } from './dto/district-response.dto';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  /**
   * GET /api/v1/locations/departments
   * Endpoint público que devuelve el catálogo de departamentos activos.
   */
  @Get('departments')
  @ApiOperation({
    summary: 'Listar departamentos activos',
    description:
      'Devuelve el catálogo de departamentos activos de El Salvador, ' +
      'ordenados alfabéticamente por nombre. Solo retorna los campos ' +
      'necesarios para selección en frontend: id, name y code. ' +
      'La respuesta se envuelve en la estructura estándar ApiSuccess<T>.',
  })
  @ApiOkResponse({
    description: 'Listado de departamentos activos obtenido exitosamente.',
    type: [DepartmentResponseDto],
  })
  async getDepartments(): Promise<DepartmentResponseDto[]> {
    return this.locationsService.findActiveDepartments();
  }

  /**
   * GET /api/v1/locations/departments/:departmentId/districts
   * Endpoint público que devuelve los distritos activos de un departamento.
   */
  @Get('departments/:departmentId/districts')
  @ApiOperation({
    summary: 'Listar distritos activos de un departamento',
    description:
      'Devuelve los distritos activos pertenecientes al departamento indicado, ' +
      'ordenados alfabéticamente por nombre. Valida que el departamento exista ' +
      'y esté activo. Retorna id, name, code y departmentId.',
  })
  @ApiParam({
    name: 'departmentId',
    description: 'UUID del departamento del cual se desean obtener los distritos',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    description: 'Listado de distritos activos del departamento obtenido exitosamente.',
    type: [DistrictResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'El departamento solicitado no existe o no está activo (DEPARTMENT_NOT_FOUND).',
  })
  async getDistrictsByDepartment(
    @Param('departmentId', new ParseUUIDPipe({ version: '4' })) departmentId: string,
  ): Promise<DistrictResponseDto[]> {
    return this.locationsService.findDistrictsByDepartment(departmentId);
  }
}
