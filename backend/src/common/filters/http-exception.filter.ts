import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determinar el status code
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // ESTE ERA EL BUG: getResponse() puede devolver string u objeto
    // hay que manejarlo en ambos casos
    let message: string | string[] = 'Error desconocido';
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        // ValidationPipe manda { message: [...], error: '...' }
        message = (res as any).message ?? (res as any).error ?? 'Error desconocido';
      }
    } else {
      // Error inesperado (bug real) — loguear el stack
      this.logger.error(`${request.method} ${request.url}`, (exception as any)?.stack);
      message = 'Error interno del servidor';
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}