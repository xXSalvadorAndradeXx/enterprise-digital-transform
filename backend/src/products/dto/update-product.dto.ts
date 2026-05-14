import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType hace TODOS los campos opcionales automáticamente
// y hereda todas las validaciones de CreateProductDto
export class UpdateProductDto extends PartialType(CreateProductDto) {}

// Resultado: { name?, description?, price?, stock?, imageUrl?, categoryId? }
// Solo se validan los campos que el cliente SÍ envíe