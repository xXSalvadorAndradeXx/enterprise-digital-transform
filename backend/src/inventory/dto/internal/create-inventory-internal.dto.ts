import { IsNotEmpty, IsString, IsOptional, IsUUID, IsInt, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryStatus } from '../../enums/inventory-status.enum';
import { CreateInventoryDetailInternalDto } from './create-inventory-detail-internal.dto';

/**
 * DTO interno para la creación de inventario principal.
 * Utilizado exclusivamente por el PurchasesModule al registrar o recepcionar compras con proveedores.
 */
export class CreateInventoryInternalDto {
  @IsNotEmpty()
  @IsString()
  productName!: string;

  @IsNotEmpty()
  @IsString()
  brand!: string;

  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsUUID('4')
  purchaseId?: string;

  @IsOptional()
  @IsString()
  mainImageUrl?: string;

  @IsOptional()
  @IsEnum(InventoryStatus)
  status?: InventoryStatus = InventoryStatus.ACTIVE;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInventoryDetailInternalDto)
  details?: CreateInventoryDetailInternalDto[];
}
