// src/module/locations/interfaces/validated-location.interface.ts
import { Department } from '../../branches/entities/department.entity';
import { District } from '../../branches/entities/district.entity';

/**
 * Resultado de una validación exitosa de ubicación (departamento + distrito).
 * Retorna ambas entidades para evitar consultas duplicadas posteriores.
 */
export interface ValidatedLocation {
  department: Department;
  district: District;
}
