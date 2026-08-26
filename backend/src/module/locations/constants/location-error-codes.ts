// src/module/locations/constants/location-error-codes.ts

/**
 * Códigos de error estables del dominio de ubicaciones.
 * Diseñados para ser interpretados programáticamente por el frontend
 * sin depender de mensajes de texto.
 */
export const LOCATION_ERRORS = {
  /**
   * El departmentId proporcionado no corresponde a ningún departamento registrado.
   * HTTP 404
   */
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',

  /**
   * El districtId proporcionado no corresponde a ningún distrito registrado.
   * HTTP 404
   */
  DISTRICT_NOT_FOUND: 'DISTRICT_NOT_FOUND',

  /**
   * La combinación departamento-distrito no es válida:
   * - Alguno de los registros está inactivo, o
   * - El distrito no pertenece al departamento indicado.
   * HTTP 422
   */
  INVALID_LOCATION: 'INVALID_LOCATION',
} as const;
