import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CustomerOrdersQueryDto } from './customer-orders-query.dto';
import { OrderStatus } from '../enums/order-status.enum';

describe('CustomerOrdersQueryDto', () => {
  it('debería pasar la validación con valores por defecto válidos', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
    expect(dto.sortOrder).toBe('DESC');
  });

  it('debería validar correctamente page y limit dentro de los rangos permitidos', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, {
      page: '2',
      limit: '50',
      status: OrderStatus.PENDING,
      sortOrder: 'ASC',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(50);
    expect(dto.status).toBe(OrderStatus.PENDING);
    expect(dto.sortOrder).toBe('ASC');
  });

  it('debería fallar la validación si page es menor a 1', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, { page: 0 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('debería fallar la validación si limit es mayor a 100', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, { limit: 150 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('debería fallar la validación si status es un enum inválido', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, {
      status: 'INVALID_STATUS',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
  });

  it('debería fallar la validación si sortOrder no es ASC ni DESC', async () => {
    const dto = plainToInstance(CustomerOrdersQueryDto, {
      sortOrder: 'INVALID',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('sortOrder');
  });
});
