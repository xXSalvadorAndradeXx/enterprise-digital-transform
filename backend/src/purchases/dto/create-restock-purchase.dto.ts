import {
  IsUUID, IsOptional, IsString,
  IsArray, ArrayMinSize, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RestockVariantDto } from './restock-variant.dto';

export class CreateRestockPurchaseDto {
  /** RN-024 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  supplierId!: string;

  /** RN-025 */
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  inventoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  /** RN-026 */
  @ApiProperty({ type: [RestockVariantDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RestockVariantDto)
  variants!: RestockVariantDto[];
}