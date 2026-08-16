import {
  IsUUID, IsString, MinLength, MaxLength,
  IsOptional, IsUrl, IsArray, ArrayMinSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePurchaseVariantDto } from './create-purchase-variant.dto';

export class CreateNewProductPurchaseDto {
  /** RN-024 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId!: string;

  @ApiProperty({ example: 'Camisa Oxford' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  productName!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  categoryId!: string;

  @ApiProperty({ example: 'Zara' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  brand!: string;

  @ApiPropertyOptional({ example: 'https://cdn.erp.com/images/camisa.jpg' })
  @IsOptional()
  @IsUrl()
  mainImageUrl?: string;

  /** RN-021: la URL proviene de POST /purchases/upload-invoice */
  @ApiPropertyOptional({ example: 'https://cdn.erp.com/invoices/inv-001.pdf' })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  /** RN-026: mínimo 1 variante */
  @ApiProperty({ type: [CreatePurchaseVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseVariantDto)
  variants!: CreatePurchaseVariantDto[];
}