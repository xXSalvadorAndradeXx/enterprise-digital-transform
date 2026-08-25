// src/module/customers/dto/update-customer-address.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCustomerAddressDto } from './create-customer-address.dto';

export class UpdateCustomerAddressDto extends PartialType(CreateCustomerAddressDto) {}
