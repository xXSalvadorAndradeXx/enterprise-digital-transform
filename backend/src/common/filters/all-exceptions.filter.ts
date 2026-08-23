import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtro global de excepciones.
 * Captura CUALQUIER excepción lanzada en cualquier capa y la homogeniza
 * al formato estándar de error definido en el TDD § 2.6:
 *
 * {
 *   statusCode, error, message, path, timestamp
 * }
 *
 * NUNCA expone el stack trace al cliente.
 * Los errores 500 se registran completos en el log del servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Error interno del servidor';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        code = this.getHttpStatusErrorCode(statusCode);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;

        // Si la excepción ya trae un código de error personalizado
        code = resp.code ?? this.getHttpStatusErrorCode(statusCode);

        // class-validator devuelve un array de mensajes en resp.message
        if (Array.isArray(resp.message)) {
          code = 'VALIDATION_ERROR';
          message = 'Los datos enviados no son válidos';
          details = resp.message;
        } else {
          message = resp.message ?? message;
          details = resp.details ?? undefined;
        }
      }
    } else if (exception instanceof Error) {
      // Error no controlado — registrar completo en servidor, nunca al cliente
      this.logger.error(
        `[Unhandled Exception] ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`[Unknown Exception]`, JSON.stringify(exception));
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatusErrorCode(statusCode: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      423: 'LOCKED',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return statusMap[statusCode] ?? 'INTERNAL_SERVER_ERROR';
  }
}