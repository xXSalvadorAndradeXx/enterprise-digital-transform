import { ApiProperty } from '@nestjs/swagger';

export class UploadInvoiceResponseDto {
  @ApiProperty({ example: 'https://storage.erp.com/invoices/2026/08/uuid.pdf' })
  invoiceUrl!: string;

  @ApiProperty({ example: 'factura-001.pdf' })
  fileName!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 204800 })
  sizeBytes!: number;
}