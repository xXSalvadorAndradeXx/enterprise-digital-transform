// src/module/locations/locations.service.ts
import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../department/entities/department.entity';
import { District } from '../district/entities/district.entity';
import { DepartmentResponseDto } from './dto/department-response.dto';
import { DistrictResponseDto } from './dto/district-response.dto';
import { ValidatedLocation } from './interfaces/validated-location.interface';
import { LOCATION_ERRORS } from './constants/location-error-codes';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  /**
   * Retorna únicamente los departamentos activos (isActive = true),
   * ordenados alfabéticamente por nombre.
   * Solo expone los campos necesarios para selección en frontend.
   */
  async findActiveDepartments(): Promise<DepartmentResponseDto[]> {
    const departments = await this.departmentRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'code'],
    });

    return departments.map(DepartmentResponseDto.fromEntity);
  }

  /**
   * Retorna los distritos activos asociados a un departamento específico.
   * Valida que el departamento exista y esté activo antes de consultar distritos.
   * @throws NotFoundException con código DEPARTMENT_NOT_FOUND si el departamento no existe o está inactivo.
   */
  async findDistrictsByDepartment(departmentId: string): Promise<DistrictResponseDto[]> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId, isActive: true },
      select: ['id'],
    });

    if (!department) {
      throw new NotFoundException({
        code: LOCATION_ERRORS.DEPARTMENT_NOT_FOUND,
        message: `No se encontró un departamento activo con id ${departmentId}`,
        details: { departmentId },
      });
    }

    const districts = await this.districtRepository.find({
      where: { departmentId, isActive: true },
      order: { name: 'ASC' },
      select: ['id', 'name', 'code', 'departmentId'],
    });

    return districts.map(DistrictResponseDto.fromEntity);
  }

  /**
   * Valida que un par (departmentId, districtId) represente una ubicación válida:
   *
   * 1. El departamento debe existir               → DEPARTMENT_NOT_FOUND
   * 2. El departamento debe estar activo           → INVALID_LOCATION
   * 3. El distrito debe existir                    → DISTRICT_NOT_FOUND
   * 4. El distrito debe estar activo               → INVALID_LOCATION
   * 5. El distrito debe pertenecer al departamento → INVALID_LOCATION
   *
   * Retorna ambas entidades validadas para evitar consultas duplicadas
   * en módulos consumidores (clientes, checkout, órdenes, direcciones).
   */
  async validateDepartmentDistrict(
    departmentId: string,
    districtId: string,
  ): Promise<ValidatedLocation> {
    // 1. Buscar departamento sin filtro de isActive para distinguir "no existe" de "inactivo"
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundException({
        code: LOCATION_ERRORS.DEPARTMENT_NOT_FOUND,
        message: `No se encontró el departamento con id ${departmentId}`,
        details: { departmentId },
      });
    }

    // 2. Verificar que el departamento esté activo
    if (!department.isActive) {
      throw new UnprocessableEntityException({
        code: LOCATION_ERRORS.INVALID_LOCATION,
        message: `El departamento "${department.name}" se encuentra inactivo`,
        details: { departmentId },
      });
    }

    // 3. Buscar distrito sin filtro de isActive para distinguir "no existe" de "inactivo"
    const district = await this.districtRepository.findOne({
      where: { id: districtId },
    });

    if (!district) {
      throw new NotFoundException({
        code: LOCATION_ERRORS.DISTRICT_NOT_FOUND,
        message: `No se encontró el distrito con id ${districtId}`,
        details: { departmentId, districtId },
      });
    }

    // 4. Verificar que el distrito esté activo
    if (!district.isActive) {
      throw new UnprocessableEntityException({
        code: LOCATION_ERRORS.INVALID_LOCATION,
        message: `El distrito "${district.name}" se encuentra inactivo`,
        details: { departmentId, districtId },
      });
    }

    // 5. Verificar que el distrito pertenezca al departamento indicado
    if (district.departmentId !== departmentId) {
      throw new UnprocessableEntityException({
        code: LOCATION_ERRORS.INVALID_LOCATION,
        message: 'El distrito seleccionado no pertenece al departamento indicado',
        details: { departmentId, districtId },
      });
    }

    return { department, district };
  }
}
