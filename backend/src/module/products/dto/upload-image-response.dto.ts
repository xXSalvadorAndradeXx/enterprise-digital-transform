import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDataDto {
  @ApiProperty({
    example: 'http://localhost:3000/uploads/products/550e8400-e29b-41d4-a716-446655440000.jpg',
    description: 'URL pública o referencia generada para la imagen cargada',
  })
  imageUrl!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000.jpg',
    description: 'Nombre único generado para el archivo cargado',
  })
  fileName!: string;

  @ApiProperty({
    example: 1048576,
    description: 'Tamaño del archivo almacenado en bytes',
  })
  sizeBytes!: number;
}

export class UploadImageResponseDto {
  @ApiProperty({ type: UploadImageDataDto })
  data!: UploadImageDataDto;

  @ApiProperty({ example: 201 })
  statusCode!: number;
}
