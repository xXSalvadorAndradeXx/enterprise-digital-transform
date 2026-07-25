import { PaginationQueryDto, SortOrder } from './pagination-query.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

describe('PaginationQueryDto', () => {
  const toDto = (plain: object) =>
    plainToInstance(PaginationQueryDto, plain);

  it('debe aceptar valores por defecto cuando no se envían parámetros', async () => {
    const dto = toDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(20);
    expect(dto.sortBy).toBe('created_at');
    expect(dto.order).toBe(SortOrder.DESC);
  });

  it('debe rechazar page = 0', async () => {
    const dto = toDto({ page: 0 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'page')).toBe(true);
  });

  it('debe rechazar limit > 100', async () => {
    const dto = toDto({ limit: 101 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'limit')).toBe(true);
  });

  it('debe rechazar un order inválido', async () => {
    const dto = toDto({ order: 'RANDOM' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'order')).toBe(true);
  });

  it('debe calcular skip correctamente', () => {
    const dto = toDto({ page: 3, limit: 20 });
    expect(dto.skip).toBe(40);
  });

  it('debe calcular skip = 0 para la primera página', () => {
    const dto = toDto({ page: 1, limit: 20 });
    expect(dto.skip).toBe(0);
  });
});