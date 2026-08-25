import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartStatus } from '../enums/cart-status.enum';
import { ProductSpecification } from '../../products/helpers/product-specification.helper';
import { UrlUtil } from '../../../common/utils/url.util';

export class CartItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890', description: 'ID del ítem' })
  id!: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-4000-a000-ef1234567890', description: 'ID del producto' })
  productId!: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-4000-a000-ef1234567890', description: 'ID de la variante' })
  variantId!: string;

  @ApiProperty({ example: 'Camisa Deportiva', description: 'Nombre comercial del producto' })
  commercialName!: string;

  @ApiPropertyOptional({ example: 'M', description: 'Talla de la variante', nullable: true })
  size!: string | null;

  @ApiPropertyOptional({ example: 'Negro', description: 'Color de la variante', nullable: true })
  color!: string | null;

  @ApiProperty({ example: 2, description: 'Cantidad seleccionada' })
  quantity!: number;

  @ApiProperty({ example: '25.00', description: 'Precio de lista unitario como string decimal' })
  unitPrice!: string;

  @ApiProperty({ example: '20.00', description: 'Precio efectivo unitario como string decimal' })
  effectiveUnitPrice!: string;

  @ApiProperty({ example: '40.00', description: 'Subtotal del ítem (cantidad * effectiveUnitPrice) como string decimal' })
  subtotal!: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/products/camisa.webp', description: 'Imagen principal del producto', nullable: true })
  primaryImage!: string | null;

  static fromEntity(entity: CartItem): CartItemResponseDto {
    const dto = new CartItemResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.variantId = entity.variantId;
    dto.quantity = entity.quantity;

    const product = entity.product;
    dto.commercialName = product?.commercialName ?? 'Producto';

    // Variante size y color
    const detail = entity.variantConfig?.inventoryDetail;
    dto.size = detail?.size ?? null;
    dto.color = detail?.color ?? null;

    // Cálculo dinámico de precio efectivo
    const salePriceNum = Number(product?.salePrice ?? 0);
    const effPriceNum = product
      ? ProductSpecification.calculateEffectivePrice(
          product.salePrice,
          product.discount,
          product.discountStartsAt,
          product.discountEndsAt,
        )
      : salePriceNum;

    dto.unitPrice = salePriceNum.toFixed(2);
    dto.effectiveUnitPrice = effPriceNum.toFixed(2);

    const subtotalNum = effPriceNum * entity.quantity;
    dto.subtotal = subtotalNum.toFixed(2);

    // Imagen principal
    const images = product?.images ?? [];
    const primaryImg = images.find((i) => i.sortOrder === 0) || images[0];
    dto.primaryImage = primaryImg ? UrlUtil.resolveImageUrl(primaryImg.imageUrl) : null;

    return dto;
  }
}

export class CartResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890', description: 'ID del carrito' })
  id!: string;

  @ApiPropertyOptional({ example: 'b1c2d3e4-f5a6-4000-a000-ef1234567890', description: 'ID del cliente si está autenticado', nullable: true })
  customerId!: string | null;

  @ApiPropertyOptional({ example: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', description: 'Hash del token de invitado si es visitante', nullable: true })
  guestTokenHash!: string | null;

  @ApiProperty({ enum: CartStatus, example: CartStatus.ACTIVE, description: 'Estado canónico del carrito' })
  status!: CartStatus;

  @ApiPropertyOptional({ example: '2026-09-01T12:00:00.000Z', description: 'Fecha de expiración para carritos de invitado', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ type: [CartItemResponseDto], description: 'Lista de ítems en el carrito' })
  items!: CartItemResponseDto[];

  @ApiProperty({ example: '80.00', description: 'Monto total sumado del carrito como string decimal' })
  total!: string;

  @ApiProperty({ example: 4, description: 'Cantidad total acumulada de unidades en el carrito' })
  itemCount!: number;

  static fromEntity(entity: Cart): CartResponseDto {
    const dto = new CartResponseDto();
    dto.id = entity.id;
    dto.customerId = entity.customerId ?? null;
    dto.guestTokenHash = entity.guestTokenHash ?? null;
    dto.status = entity.status;
    dto.expiresAt = entity.expiresAt ?? null;

    const items = entity.items ?? [];
    dto.items = items.map((i) => CartItemResponseDto.fromEntity(i));

    const totalNum = dto.items.reduce((acc, i) => acc + Number(i.subtotal), 0);
    dto.total = totalNum.toFixed(2);

    dto.itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

    return dto;
  }
}
