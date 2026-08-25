import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { CartStatus } from '../enums/cart-status.enum';
import { ProductSpecification } from '../../products/helpers/product-specification.helper';
import { UrlUtil } from '../../../common/utils/url.util';

export class CartItemVariantDto {
  @ApiProperty({ example: 'M', description: 'Talla de la variante' })
  size!: string;

  @ApiProperty({ example: 'Negro', description: 'Color de la variante' })
  color!: string;
}

export class CartItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4000-a000-ef1234567890', description: 'ID del ítem' })
  id!: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-4000-a000-ef1234567890', description: 'ID del producto' })
  productId!: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-4000-a000-ef1234567890', description: 'ID de la variante' })
  variantId!: string;

  @ApiProperty({ example: 'Camisa Deportiva', description: 'Nombre comercial del producto' })
  productName!: string;

  @ApiProperty({ example: 'Camisa Deportiva', description: 'Nombre comercial del producto (alias para retrocompatibilidad)' })
  commercialName!: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/products/camisa.webp', description: 'URL absoluta de la imagen principal del producto', nullable: true })
  imageUrl!: string | null;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/products/camisa.webp', description: 'Imagen principal (alias para retrocompatibilidad)', nullable: true })
  primaryImage!: string | null;

  @ApiProperty({ type: CartItemVariantDto, description: 'Información reducida de la variante seleccionada' })
  variant!: CartItemVariantDto;

  @ApiPropertyOptional({ example: 'M', description: 'Talla (retrocompatibilidad)', nullable: true })
  size!: string | null;

  @ApiPropertyOptional({ example: 'Negro', description: 'Color (retrocompatibilidad)', nullable: true })
  color!: string | null;

  @ApiProperty({ example: 2, description: 'Cantidad seleccionada' })
  quantity!: number;

  @ApiProperty({ example: 10, description: 'Stock real disponible en inventario para esta variante' })
  availableStock!: number;

  @ApiProperty({ example: '50.00', description: 'Precio de lista por unidad como string decimal' })
  salePrice!: string;

  @ApiProperty({ example: '40.00', description: 'Precio efectivo actual por unidad como string decimal' })
  unitPrice!: string;

  @ApiProperty({ example: '40.00', description: 'Precio efectivo unitario (alias para retrocompatibilidad)' })
  effectiveUnitPrice!: string;

  @ApiProperty({ example: '20.00', description: 'Monto total de descuento de esta línea como string decimal' })
  lineDiscount!: string;

  @ApiProperty({ example: '80.00', description: 'Monto total final de la línea (unitPrice * cantidad) como string decimal' })
  lineTotal!: string;

  @ApiProperty({ example: '80.00', description: 'Subtotal de la línea (alias para retrocompatibilidad)' })
  subtotal!: string;

  static fromEntity(entity: CartItem): CartItemResponseDto {
    const dto = new CartItemResponseDto();
    dto.id = entity.id;
    dto.productId = entity.productId;
    dto.variantId = entity.variantId;
    dto.quantity = entity.quantity;

    const product = entity.product;
    dto.productName = product?.commercialName ?? 'Producto';
    dto.commercialName = dto.productName;

    // Variante size y color
    const detail = entity.variantConfig?.inventoryDetail;
    const sizeStr = detail?.size ?? 'Única';
    const colorStr = detail?.color ?? 'Único';

    dto.variant = {
      size: sizeStr,
      color: colorStr,
    };
    dto.size = detail?.size ?? null;
    dto.color = detail?.color ?? null;

    dto.availableStock = detail ? Number(detail.stock ?? 0) : 0;

    // Precios y descuentos en tiempo real
    const salePriceNum = Number(product?.salePrice ?? 0);
    const effPriceNum = product
      ? ProductSpecification.calculateEffectivePrice(
          product.salePrice,
          product.discount,
          product.discountStartsAt,
          product.discountEndsAt,
        )
      : salePriceNum;

    const unitPriceNum = effPriceNum;
    const lineBaseTotalNum = salePriceNum * entity.quantity;
    const lineTotalNum = unitPriceNum * entity.quantity;
    const lineDiscountNum = Math.max(0, lineBaseTotalNum - lineTotalNum);

    dto.salePrice = salePriceNum.toFixed(2);
    dto.unitPrice = unitPriceNum.toFixed(2);
    dto.effectiveUnitPrice = unitPriceNum.toFixed(2);
    dto.lineDiscount = lineDiscountNum.toFixed(2);
    dto.lineTotal = lineTotalNum.toFixed(2);
    dto.subtotal = dto.lineTotal;

    // Imagen principal absoluta
    const images = product?.images ?? [];
    const primaryImg = images.find((i) => i.sortOrder === 0) || images[0];
    dto.imageUrl = primaryImg ? UrlUtil.resolveImageUrl(primaryImg.imageUrl) : null;
    dto.primaryImage = dto.imageUrl;

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

  @ApiProperty({ example: '100.00', description: 'Subtotal global sin descuento (suma de salePrice * cantidad) como string decimal' })
  subtotal!: string;

  @ApiProperty({ example: '20.00', description: 'Descuento total acumulado como string decimal' })
  discountTotal!: string;

  @ApiProperty({ example: '80.00', description: 'Monto total a pagar (subtotal - discountTotal) como string decimal' })
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

    const subtotalNum = dto.items.reduce(
      (acc, i) => acc + Number(i.salePrice) * i.quantity,
      0,
    );
    const discountTotalNum = dto.items.reduce(
      (acc, i) => acc + Number(i.lineDiscount),
      0,
    );
    const totalNum = Math.max(0, subtotalNum - discountTotalNum);

    dto.subtotal = subtotalNum.toFixed(2);
    dto.discountTotal = discountTotalNum.toFixed(2);
    dto.total = totalNum.toFixed(2);

    dto.itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

    return dto;
  }
}
