// src/module/customers/dto/customer-address.dto.spec.ts
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCustomerAddressDto } from './create-customer-address.dto';
import { UpdateCustomerAddressDto } from './update-customer-address.dto';

describe('Customer Address DTOs Validation', () => {
  describe('CreateCustomerAddressDto', () => {
    it('debe ser válido cuando se envía alias en lugar de label', async () => {
      const payload = {
        departmentId: '1',
        districtId: '187',
        alias: 'Mi Casa',
        addressLine: 'Calle Principal #123',
        city: 'San Salvador',
        phone: '71234567',
        recipientName: 'Carlos Gómez',
        reference: 'Frente al parque',
        isDefault: true,
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.getResolvedLabel()).toBe('Mi Casa');
      expect(dto.phone).toBe('+50371234567');
      expect(dto.isDefault).toBe(true);
    });

    it('debe ser válido cuando se envía label en lugar de alias', async () => {
      const payload = {
        departmentId: '1',
        districtId: '187',
        label: 'Trabajo',
        addressLine: 'Boulevard Los Próceres #45',
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.getResolvedLabel()).toBe('Trabajo');
    });

    it('debe fallar si no se envía ni alias ni label', async () => {
      const payload = {
        departmentId: '1',
        districtId: '187',
        addressLine: 'Calle Principal #123',
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const aliasOrLabelError = errors.some(
        (e) => e.property === 'alias' || e.property === 'label',
      );
      expect(aliasOrLabelError).toBe(true);
    });

    it('debe fallar si departmentId o districtId faltan', async () => {
      const payload = {
        alias: 'Casa',
        addressLine: 'Calle Principal #123',
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      const deptError = errors.find((e) => e.property === 'departmentId');
      const distError = errors.find((e) => e.property === 'districtId');

      expect(deptError).toBeDefined();
      expect(distError).toBeDefined();
    });

    it('debe fallar si addressLine es menor a 5 caracteres', async () => {
      const payload = {
        departmentId: '1',
        districtId: '187',
        alias: 'Casa',
        addressLine: 'Casa',
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      const addrError = errors.find((e) => e.property === 'addressLine');
      expect(addrError).toBeDefined();
    });

    it('debe fallar con teléfono salvadoreño inválido', async () => {
      const payload = {
        departmentId: '1',
        districtId: '187',
        alias: 'Casa',
        addressLine: 'Calle Principal #123',
        phone: '12345678', // No inicia en 2, 6 o 7
      };

      const dto = plainToInstance(CreateCustomerAddressDto, payload);
      const errors = await validate(dto);

      const phoneError = errors.find((e) => e.property === 'phone');
      expect(phoneError).toBeDefined();
    });
  });

  describe('UpdateCustomerAddressDto', () => {
    it('debe ser válido en actualización parcial sin enviar alias ni label', async () => {
      const payload = {
        city: 'Santa Tecla',
        reference: 'Portón verde',
      };

      const dto = plainToInstance(UpdateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('debe ser válido cuando solo se actualiza el alias', async () => {
      const payload = {
        alias: 'Oficina Central',
      };

      const dto = plainToInstance(UpdateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.getResolvedLabel()).toBe('Oficina Central');
    });

    it('debe ser válido cuando solo se actualiza isDefault', async () => {
      const payload = {
        isDefault: true,
      };

      const dto = plainToInstance(UpdateCustomerAddressDto, payload);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.isDefault).toBe(true);
    });
  });
});
