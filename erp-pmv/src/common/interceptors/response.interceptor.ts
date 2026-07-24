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

        // Respuesta paginada ya tiene { data, meta } — no envolver
        if (
          typeof data === 'object' &&
          'meta' in (data as object) &&
          'data' in (data as object)
        ) {
          return data;
        }

        // Respuesta individual — envolver en { data, statusCode }
        return {
          data,
          statusCode: response.statusCode,
        };
      }),
    );
  }
}