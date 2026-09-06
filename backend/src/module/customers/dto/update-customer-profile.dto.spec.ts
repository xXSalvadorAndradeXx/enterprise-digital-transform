import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateCustomerProfileDto } from './update-customer-profile.dto';

describe('UpdateCustomerProfileDto', () => {
  it('debe ser válido cuando se proporcionan name y phone válidos', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      name: 'Carlos Eduardo Gómez',
      phone: '+50371234567',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.getResolvedName()).toBe('Carlos Eduardo Gómez');
  });

  it('debe aplicar trim al nombre y eliminar espacios innecesarios', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      name: '   Carlos Eduardo   ',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.name).toBe('Carlos Eduardo');
    expect(dto.getResolvedName()).toBe('Carlos Eduardo');
  });

  it('debe rechazar un nombre compuesto únicamente por espacios en blanco', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      name: '     ',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('debe rechazar un nombre con menos de 3 caracteres', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      name: 'Ca',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find((e) => e.property === 'name');
    expect(nameError).toBeDefined();
  });

  it('debe aceptar fullName como alias válido', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      fullName: 'Ana Patricia Peña',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.getResolvedName()).toBe('Ana Patricia Peña');
  });

  it('debe transformar automáticamente un teléfono de 8 dígitos al formato +503', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      phone: '71234567',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.phone).toBe('+50371234567');
  });

  it('debe rechazar teléfonos que no pertenezcan al rango válido de El Salvador', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {
      phone: '+50312345678', // Comienza con 1 (inválido en SV)
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const phoneError = errors.find((e) => e.property === 'phone');
    expect(phoneError).toBeDefined();
  });

  it('debe ser válido cuando ambos campos se omiten (objeto vacío para actualización parcial)', async () => {
    const dto = plainToInstance(UpdateCustomerProfileDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.getResolvedName()).toBeUndefined();
  });
});
