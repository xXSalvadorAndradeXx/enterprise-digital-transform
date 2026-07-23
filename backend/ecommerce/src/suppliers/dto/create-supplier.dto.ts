import { IsString, MinLength, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSupplierDto {
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsPhoneNumber('SV')
  phone?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
