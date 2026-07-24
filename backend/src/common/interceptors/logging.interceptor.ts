import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Interceptor de logging por petición HTTP.
 * TDD § 2.7 y § 9.3 — Registra: método, ruta, usuario, código HTTP, duración.
 * NUNCA incluye contraseñas, tokens ni datos personales sensibles en los logs.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url } = request;
    const userId: string = (request as any).user?.id ?? 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} | user:${userId} | ${response.statusCode} | ${duration}ms`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          this.logger.warn(
            `${method} ${url} | user:${userId} | ERROR | ${duration}ms | ${err.message}`,
          );
        },
      }),
    );
  }
}