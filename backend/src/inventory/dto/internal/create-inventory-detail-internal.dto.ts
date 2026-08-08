import { IsNotEmpty, IsString, IsNumber, IsOptional, IsUUID, Min, Matches } from 'class-validator';

/**
 * DTO interno para la creación de variantes de inventario (InventoryDetail).
 * Utilizado exclusivamente por el PurchasesModule al registrar o recepcionar compras.
 */
export class CreateInventoryDetailInternalDto {
  @IsNotEmpty()
  @IsString()
  sku!: string;

  @IsNotEmpty()
  @IsString()
  size!: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'El color debe tener formato hexadecimal #RRGGBB' })
  color!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  stock!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitCost!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number = 0;

  @IsOptional()
  @IsUUID('4')
  purchaseItemId?: string;
}
