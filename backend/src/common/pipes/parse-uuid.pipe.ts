import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Pipe que valida que un parámetro de ruta sea un UUID v4 válido.
 * TDD § 2.3 — Pipes: transformar y validar parámetros de entrada.
 *
 * Uso: @Param('id', ParseUuidPipe) id: string
 *
 * Complementa al ParseUUIDPipe nativo de NestJS con un mensaje de error
 * más descriptivo en español para el equipo y el Frontend.
 */
@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value || !this.UUID_REGEX.test(value)) {
      throw new BadRequestException(
        `El parámetro '${metadata.data ?? 'id'}' debe ser un UUID v4 válido. Valor recibido: '${value}'`,
      );
    }
    return value;
  }
}