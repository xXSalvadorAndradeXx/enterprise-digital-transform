import { ParseUuidPipe } from './parse-uuid.pipe';
import { BadRequestException } from '@nestjs/common';
import { ArgumentMetadata } from '@nestjs/common';

describe('ParseUuidPipe', () => {
  let pipe: ParseUuidPipe;
  const metadata: ArgumentMetadata = { type: 'param', data: 'id' };

  beforeEach(() => {
    pipe = new ParseUuidPipe();
  });

  it('debe retornar el UUID válido sin modificarlo', () => {
    const uuid = 'a1b2c3d4-e5f6-4000-a000-ef1234567890';
    expect(pipe.transform(uuid, metadata)).toBe(uuid);
  });

  it('debe lanzar BadRequestException con un string no-UUID', () => {
    expect(() => pipe.transform('no-es-un-uuid', metadata)).toThrow(
      BadRequestException,
    );
  });

  it('debe lanzar BadRequestException con un string vacío', () => {
    expect(() => pipe.transform('', metadata)).toThrow(BadRequestException);
  });

  it('debe lanzar BadRequestException con un UUID v1 (versión incorrecta)', () => {
    // UUID v1 — no es v4
    expect(() =>
      pipe.transform('a1b2c3d4-e5f6-1000-a000-ef1234567890', metadata),
    ).toThrow(BadRequestException);
  });

  it('el mensaje de error debe mencionar el nombre del parámetro', () => {
    try {
      pipe.transform('invalido', metadata);
    } catch (e) {
      expect((e as BadRequestException).message).toContain("'id'");
    }
  });
});