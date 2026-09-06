import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerFavorite } from './entities/customer-favorite.entity';
import { Product } from '../products/entities/product.entity';
import { PublicProductResponseDto } from '../products/dto/public-product-response.dto';
import { ProductSpecification } from '../products/helpers/product-specification.helper';

@Injectable()
export class CustomerFavoritesService {
  constructor(
    @InjectRepository(CustomerFavorite)
    private readonly favoriteRepository: Repository<CustomerFavorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Obtiene todos los favoritos del cliente autenticado con DTO comercial reutilizable.
   */
  async findAll(customerId: string) {
    const favorites = await this.favoriteRepository.find({
      where: { customerId },
      relations: [
        'product',
        'product.images',
        'product.tags',
        'product.inventory',
        'product.inventory.category',
        'product.variantConfigs',
        'product.variantConfigs.inventoryDetail',
      ],
      order: { createdAt: 'DESC' },
    });

    const items = favorites
      .filter((fav) => fav.product !== null && fav.product !== undefined)
      .map((fav) => {
        const product = fav.product;
        const effectivePriceNum = ProductSpecification.calculateEffectivePrice(
          product.salePrice,
          product.discount,
          product.discountStartsAt,
          product.discountEndsAt,
        );
        const inStock = ProductSpecification.isProductPublishableAndSellable(product);
        const productDto = PublicProductResponseDto.fromEntity(
          product,
          effectivePriceNum,
          inStock,
        );

        return {
          favoriteId: fav.id,
          addedAt: fav.createdAt,
          product: productDto,
        };
      });

    return items;
  }

  /**
   * Agrega un producto a la lista de favoritos del cliente (idempotente).
   */
  async add(customerId: string, productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado o no disponible');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { customerId, productId },
    });

    if (existing) {
      return {
        favoriteId: existing.id,
        addedAt: existing.createdAt,
        message: 'El producto ya se encuentra en tus favoritos',
      };
    }

    const newFavorite = this.favoriteRepository.create({
      customerId,
      productId,
    });

    const saved = await this.favoriteRepository.save(newFavorite);

    return {
      favoriteId: saved.id,
      addedAt: saved.createdAt,
      message: 'Producto agregado a favoritos correctamente',
    };
  }

  /**
   * Elimina un producto específico de la lista de favoritos del cliente.
   */
  async remove(customerId: string, productId: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { customerId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('El producto no se encuentra en tus favoritos');
    }

    await this.favoriteRepository.remove(favorite);

    return {
      success: true,
      message: 'Producto eliminado de favoritos correctamente',
    };
  }

  /**
   * Elimina todos los favoritos del cliente autenticado.
   */
  async clearAll(customerId: string) {
    await this.favoriteRepository.delete({ customerId });

    return {
      success: true,
      message: 'Todos los favoritos han sido eliminados correctamente',
    };
  }

  /**
   * Verifica si un producto específico está en los favoritos del cliente.
   */
  async isFavorite(customerId: string, productId: string): Promise<boolean> {
    const count = await this.favoriteRepository.count({
      where: { customerId, productId },
    });
    return count > 0;
  }

  /**
   * Exporta consulta de IDs de clientes que han marcado un producto como favorito.
   * Utilizado por integraciones de ofertas/notificaciones (Favorite Offers).
   */
  async findCustomerIdsByProduct(productId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { productId },
      select: ['customerId'],
    });
    return favorites.map((fav) => fav.customerId);
  }
}
