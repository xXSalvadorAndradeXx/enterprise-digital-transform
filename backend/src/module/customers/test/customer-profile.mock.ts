import { Customer } from '../entities/customer.entity';
import { CustomerProfileResponseDto } from '../dto/customer-profile-response.dto';
import type { CurrentCustomerPayload } from '../decorators/current-customer.decorator';

export const MOCK_CUSTOMER_ID = 'd3b07384-d113-49cd-a5d6-8c4d5865dec1';

export function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: MOCK_CUSTOMER_ID,
    fullName: 'Carlos Eduardo Gómez',
    email: 'carlos.gomez@correo.com',
    phone: '+50371234567',
    dui: '01234567-8',
    isActive: true,
    totalSpent: 150.5,
    totalOrders: 3,
    passwordHash: 'hashed_super_secret_password',
    createdAt: new Date('2026-08-26T19:53:00.000Z'),
    updatedAt: new Date('2026-08-26T19:53:00.000Z'),
    deletedAt: null,
    addresses: [],
    orders: [],
    ...overrides,
  } as Customer;
}

export function createMockCustomerPayload(
  overrides: Partial<CurrentCustomerPayload> = {},
): CurrentCustomerPayload {
  return {
    id: MOCK_CUSTOMER_ID,
    customerId: MOCK_CUSTOMER_ID,
    email: 'carlos.gomez@correo.com',
    fullName: 'Carlos Eduardo Gómez',
    phone: '+50371234567',
    dui: '01234567-8',
    createdAt: new Date('2026-08-26T19:53:00.000Z'),
    type: 'CUSTOMER',
    ...overrides,
  };
}

export function createMockProfileResponse(
  overrides: Partial<CustomerProfileResponseDto> = {},
): CustomerProfileResponseDto {
  return {
    id: MOCK_CUSTOMER_ID,
    name: 'Carlos Eduardo Gómez',
    fullName: 'Carlos Eduardo Gómez',
    email: 'carlos.gomez@correo.com',
    phone: '+50371234567',
    dui: '01234567-8',
    role: 'cliente',
    createdAt: new Date('2026-08-26T19:53:00.000Z'),
    ...overrides,
  };
}
