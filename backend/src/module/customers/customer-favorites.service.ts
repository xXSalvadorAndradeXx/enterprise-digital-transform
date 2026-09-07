import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerFavorite } from './entities/customer-favorite.entity';
import { Product } from '../products/entities/product.entity';
import { PublicProductResponseDto } from '../products/dto/public-product-response.dto';
import { ProductSpecification } from '../products/helpers/product-specification.helper';
import { FavoritesQueryDto } from './dto/favorites-query.dto';
import {
  FavoriteProductSummaryDto,
  FavoriteResponseDto,
  PaginatedFavoritesResponseDto,
} from './dto/favorite-response.dto';
import { FavoriteStatusResponseDto } from './dto/favorite-status-response.dto';

@Injectable()
export class CustomerFavoritesService {
  constructor(
    @InjectRepository(CustomerFavorite)
    private readonly favoriteRepository: Repository<CustomerFavorite>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Obtiene todos los favoritos del cliente autenticado con soporte de paginación y DTO comercial.
   */
  async findAll(
    customerId: string,
    query?: FavoritesQueryDto,
  ): Promise<PaginatedFavoritesResponseDto> {
    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const [favorites, total] = await this.favoriteRepository.findAndCount({
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
      skip,
      take: limit,
    });

    const items: FavoriteResponseDto[] = favorites
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
        const publicDto = PublicProductResponseDto.fromEntity(
          product,
          effectivePriceNum,
          inStock,
        );
        const summary = FavoriteProductSummaryDto.fromPublicDto(publicDto);

        return {
          favoriteId: fav.id,
          createdAt: fav.createdAt.toISOString(),
          product: summary,
        };
      });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Agrega un producto a la lista de favoritos del cliente autenticado.
   * Retorna 201 con la relación y los datos actuales del producto.
   * Lanza 404 si el producto no existe o está en soft delete.
   * Lanza 409 (FAVORITE_ALREADY_EXISTS) si el producto ya está en favoritos.
   */
  async add(customerId: string, productId: string): Promise<FavoriteResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: [
        'images',
        'tags',
        'inventory',
        'inventory.category',
        'variantConfigs',
        'variantConfigs.inventoryDetail',
      ],
    });

    if (!product || product.deletedAt !== null) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'El producto especificado no existe o no se encuentra disponible',
      });
    }

    const existing = await this.favoriteRepository.findOne({
      where: { customerId, productId },
    });

    if (existing) {
      throw new ConflictException({
        code: 'FAVORITE_ALREADY_EXISTS',
        message: 'El producto ya se encuentra guardado en tus favoritos',
      });
    }

    const newFavorite = this.favoriteRepository.create({
      customerId,
      productId,
    });

    let saved: CustomerFavorite;
    try {
      saved = await this.favoriteRepository.save(newFavorite);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException({
          code: 'FAVORITE_ALREADY_EXISTS',
          message: 'El producto ya se encuentra guardado en tus favoritos',
        });
      }
      throw error;
    }

    const effectivePriceNum = ProductSpecification.calculateEffectivePrice(
      product.salePrice,
      product.discount,
      product.discountStartsAt,
      product.discountEndsAt,
    );
    const inStock = ProductSpecification.isProductPublishableAndSellable(product);
    const publicDto = PublicProductResponseDto.fromEntity(
      product,
      effectivePriceNum,
      inStock,
    );
    const summary = FavoriteProductSummaryDto.fromPublicDto(publicDto);

    return {
      favoriteId: saved.id,
      createdAt: saved.createdAt.toISOString(),
      product: summary,
    };
  }

  /**
   * Elimina un producto específico de la lista de favoritos del cliente autenticado.
   */
  async remove(customerId: string, productId: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { customerId, productId },
    });

    if (!favorite) {
      throw new NotFoundException({
        code: 'FAVORITE_NOT_FOUND',
        message: 'El producto no se encuentra en tus favoritos',
      });
    }

    await this.favoriteRepository.remove(favorite);

    return {
      success: true,
      message: 'Producto eliminado de favoritos correctamente',
    };
  }

  /**
   * Elimina masivamente todos los favoritos del cliente autenticado en una sola consulta SQL.
   * Es idempotente: si la lista ya está vacía, retorna deletedCount: 0 sin arrojar error.
   */
  async clearAll(customerId: string) {
    const result = await this.favoriteRepository.delete({ customerId });
    const deletedCount = result.affected ?? 0;

    return {
      deletedCount,
      message: 'Todos los favoritos han sido eliminados correctamente',
    };
  }

  /**
   * Verifica si un producto específico está en los favoritos del cliente (botón de corazón global).
   */
  async isFavorite(
    customerId: string,
    productId: string,
  ): Promise<FavoriteStatusResponseDto> {
    const count = await this.favoriteRepository.count({
      where: { customerId, productId },
    });
    return {
      productId,
      isFavorite: count > 0,
    };
  }

  /**
   * Exporta consulta de IDs de clientes que han marcado un producto como favorito.
   */
  async findCustomerIdsByProduct(productId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { productId },
      select: ['customerId'],
    });
    return favorites.map((fav) => fav.customerId);
  }
}
