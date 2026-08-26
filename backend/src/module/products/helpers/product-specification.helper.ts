import { Product } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';
import { InventoryStatus } from '../../inventory/enums/inventory-status.enum';

export class ProductSpecification {
  /**
   * Calcula el precio efectivo (effectivePrice) según vigencia del descuento.
   * Si el descuento es válido, se encuentre dentro del rango [discountStartsAt, discountEndsAt]
   * y es > 0, se aplica: salePrice * (1 - discount / 100).
   * De lo contrario, se retorna salePrice.
   */
  static calculateEffectivePrice(
    salePrice: number,
    discount?: number | null,
    discountStartsAt?: Date | string | null,
    discountEndsAt?: Date | string | null,
  ): number {
    const price = Number(salePrice ?? 0);
    const disc = Number(discount ?? 0);

    if (disc <= 0) {
      return price;
    }

    const now = new Date();

    if (discountStartsAt) {
      const startsAt = new Date(discountStartsAt);
      if (!isNaN(startsAt.getTime()) && startsAt > now) {
        return price;
      }
    }

    if (discountEndsAt) {
      const endsAt = new Date(discountEndsAt);
      if (!isNaN(endsAt.getTime()) && endsAt < now) {
        return price;
      }
    }

    const effective = price * (1 - disc / 100);
    return Number(effective.toFixed(2));
  }

  /**
   * Determina si un producto cumple con las 4 condiciones canónicas para ser
   * visible y comercializable en el e-commerce:
   * 1. status === ProductStatus.ACTIVE
   * 2. isPublished === true
   * 3. deletedAt === null
   * 4. stockTotal > 0 (proveniente de inventario disponible o stock de detalles)
   */
  static isProductPublishableAndSellable(product: Product): boolean {
    if (!product) return false;

    // 1. Estado comercial ACTIVE
    if (product.status !== ProductStatus.ACTIVE) {
      return false;
    }

    // 2. Bandera de publicación independiente isPublished = true
    if (!product.isPublished) {
      return false;
    }

    // 3. Registro no eliminado por Soft Delete
    if (product.deletedAt !== null && product.deletedAt !== undefined) {
      return false;
    }

    // 4. Stock disponible en inventario > 0
    if (product.inventory) {
      if (product.inventory.status === InventoryStatus.OUT_OF_STOCK) {
        return false;
      }
      const availableStock = Number(
        product.inventory.available ?? product.inventory.stock ?? 0,
      );
      if (availableStock <= 0) {
        return false;
      }
    }

    return true;
  }
}
