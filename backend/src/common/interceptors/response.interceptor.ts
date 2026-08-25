import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

/**
 * Interceptor de respuesta estándar.
 * TDD § 2.7 — Envuelve toda respuesta exitosa en { data, statusCode }
 * salvo cuando ya es una respuesta paginada { data[], meta }.
 *
 * Respuesta individual:  { data: {...}, statusCode: 200 }
 * Respuesta paginada:    { data: [...], meta: {...} }   (sin envolver)
 * Respuesta 204:         sin cuerpo
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // 204 No Content — no envolver
        if (data === null || data === undefined) {
          return data;
        }

        // Si ya está envuelto en la estructura estándar, no volver a envolver
        if (
          typeof data === 'object' &&
          'success' in (data as object) &&
          'data' in (data as object) &&
          (data as any).success === true
        ) {
          return data;
        }

        // Respuesta individual, colección o paginada — envolver en { success: true, data }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}