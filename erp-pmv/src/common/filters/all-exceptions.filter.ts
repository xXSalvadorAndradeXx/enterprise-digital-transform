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
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = this.getHttpStatusText(statusCode);
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, any>;

        // class-validator devuelve un array de mensajes en resp.message
        if (Array.isArray(resp.message)) {
          message = resp.message.join('; ');
        } else {
          message = resp.message ?? message;
        }

        error = resp.error ?? this.getHttpStatusText(statusCode);
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
      statusCode,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatusText(statusCode: number): string {
    const statusMap: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      423: 'Locked',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
    };
    return statusMap[statusCode] ?? 'Error';
  }
}