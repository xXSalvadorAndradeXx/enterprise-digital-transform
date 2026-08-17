/**
 * Estructura estándar de error utilizada
 * por todos los módulos del ERP.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
}