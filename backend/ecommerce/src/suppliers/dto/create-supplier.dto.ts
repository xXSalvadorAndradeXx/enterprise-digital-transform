import { IsString, MinLength, IsOptional, IsPhoneNumber, IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Nombre del proveedor (mínimo 2 caracteres)', example: 'Distribuidora San Salvador', minLength: 2 })
  @IsString()
  @MinLength(2)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiPropertyOptional({ description: 'Nombre de la persona de contacto', example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto para El Salvador (8 dígitos o formato internacional +503)', example: '7594-3334' })
  @IsOptional()
  @IsPhoneNumber('SV')
  phone?: string;

  @ApiPropertyOptional({ description: 'Correo electrónico de contacto', example: 'contacto@sansalvador.sv' })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;

  @ApiPropertyOptional({ description: 'Dirección física del proveedor', example: 'Calle Principal #123, San Salvador' })
  @IsOptional()
  @IsString()
  address?: string;
}
