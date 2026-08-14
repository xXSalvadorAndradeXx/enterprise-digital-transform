import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductTag } from './entities/product-tag.entity';
import { ProductVariantConfig } from './entities/product-variant-config.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryDetail } from '../inventory/entities/inventory-detail.entity';
import { InventoryStatus } from '../inventory/enums/inventory-status.enum';
import { ProductStatus } from './enums/product-status.enum';
import { PRODUCT_STATUS_TRANSITIONS } from './constants/product-status-transitions.constant';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductFilterDto, SortOrder } from './dto/product-filter.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PaginatedResponse } from '../common/interfaces/api-response.interface';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    user?: any,
  ): Promise<ProductResponseDto> {
    const {
      inventoryId,
      commercialName,
      description,
      salePrice,
      discount,
      discountEndsAt,
      status,
      imageUrls = [],
      tags = [],
      variantConfigs = [],
    } = createProductDto;

    const safeImageUrls = imageUrls || [];
    const safeTags = tags || [];
    const safeVariantConfigs = variantConfigs || [];
    const actorId = user?.id ?? user?.userId ?? null;

    // Regla RN-P-003: Advertencia mediante Logger.warn cuando salePrice === 0
    if (Number(salePrice) === 0) {
      this.logger.warn(
        `Creando producto "${commercialName}" con precio de venta igual a cero.`,
      );
    }

    // Regla RN-P-005: Validaciones de descuento
    if (discount && Number(discount) > 0) {
      if (!discountEndsAt) {
        throw new UnprocessableEntityException(
          'Debe proporcionar una fecha de fin para el descuento',
        );
      }
      const discountEndDate = new Date(discountEndsAt);
      if (isNaN(discountEndDate.getTime()) || discountEndDate < new Date()) {
        throw new UnprocessableEntityException(
          'La fecha de fin del descuento debe ser una fecha válida mayor a la fecha actual',
        );
      }
    }

    // Validación de cantidad de imágenes (máximo 10)
    if (safeImageUrls.length > 10) {
      throw new UnprocessableEntityException(
        'Se permite un máximo de 10 imágenes por producto',
      );
    }

    // Validación de cantidad de etiquetas (máximo 20)
    if (safeTags.length > 20) {
      throw new UnprocessableEntityException(
        'Se permite un máximo de 20 etiquetas por producto',
      );
    }

    // Deduplicación silenciosa de etiquetas
    const deduplicatedTags = Array.from(
      new Set(safeTags.map((t) => t.trim())),
    ).filter((t) => t.length > 0);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validación de Inventario
      if (inventoryId) {
        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { id: inventoryId },
        });

        if (!inventory) {
          throw new NotFoundException('El inventario especificado no existe');
        }

        // RN-P-001: Verificar estado de inventario
        if (inventory.status === InventoryStatus.OUT_OF_STOCK) {
          throw new ConflictException(
            'El inventario seleccionado no tiene stock disponible',
          );
        }

        // RN-P-002: Verificar que no exista otro producto activo asociado al mismo inventory_id
        const existingActiveProduct = await queryRunner.manager
          .createQueryBuilder(Product, 'product')
          .where('product.inventory_id = :inventoryId', { inventoryId })
          .andWhere('product.status != :discontinued', {
            discontinued: ProductStatus.DISCONTINUED,
          })
          .andWhere('product.deleted_at IS NULL')
          .getOne();

        if (existingActiveProduct) {
          throw new ConflictException(
            'El inventario seleccionado ya se encuentra asociado a un producto activo',
          );
        }
      }

      // Validación de variantes
      if (safeVariantConfigs.length > 0) {
        if (!inventoryId) {
          throw new UnprocessableEntityException(
            'Debe asociar un inventario para configurar variantes',
          );
        }

        for (const vc of safeVariantConfigs) {
          const detail = await queryRunner.manager.findOne(InventoryDetail, {
            where: { id: vc.inventoryDetailId, inventoryId },
          });

          if (!detail) {
            throw new UnprocessableEntityException(
              `La variante con ID ${vc.inventoryDetailId} no pertenece al inventario seleccionado`,
            );
          }
        }
      }

      // --- Transacción T7-1: Inserción secuencial ---

      // Step 1: INSERT products
      const productEntity = queryRunner.manager.create(Product, {
        inventoryId: inventoryId ?? null,
        commercialName,
        description: description ?? null,
        salePrice,
        discount: discount ?? 0,
        discountEndsAt: discountEndsAt ? new Date(discountEndsAt) : null,
        status: status ?? ProductStatus.DRAFT,
        createdById: actorId,
        updatedById: actorId,
      });

      const savedProduct = await queryRunner.manager.save(
        Product,
        productEntity,
      );

      // Step 2: INSERT product_images
      if (safeImageUrls.length > 0) {
        const imageEntities = safeImageUrls.map((url, index) =>
          queryRunner.manager.create(ProductImage, {
            productId: savedProduct.id,
            imageUrl: url,
            sortOrder: index,
          }),
        );
        await queryRunner.manager.save(ProductImage, imageEntities);
      }

      // Step 3: INSERT product_tags
      if (deduplicatedTags.length > 0) {
        const tagEntities = deduplicatedTags.map((tag) =>
          queryRunner.manager.create(ProductTag, {
            productId: savedProduct.id,
            tag,
          }),
        );
        await queryRunner.manager.save(ProductTag, tagEntities);
      }

      // Step 4: INSERT product_variant_config & Step 5: UPDATE inventory_details
      if (safeVariantConfigs.length > 0) {
        const variantEntities = safeVariantConfigs.map((vc) =>
          queryRunner.manager.create(ProductVariantConfig, {
            productId: savedProduct.id,
            inventoryDetailId: vc.inventoryDetailId,
            minStock: vc.minStock,
          }),
        );
        await queryRunner.manager.save(ProductVariantConfig, variantEntities);

        for (const vc of safeVariantConfigs) {
          await queryRunner.manager.update(
            InventoryDetail,
            { id: vc.inventoryDetailId },
            { minStock: vc.minStock },
          );
        }
      }

      await queryRunner.commitTransaction();

      // Consulta final post-commit
      const createdProduct = await this.findOneEntity(savedProduct.id);
      return ProductResponseDto.fromEntity(createdProduct);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error en transacción T7-1 al crear producto: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    user?: any,
  ): Promise<ProductResponseDto> {
    // 1. Restricción de inventoryId: no se permite modificar la relación de inventario
    if (updateProductDto.inventoryId !== undefined) {
      throw new UnprocessableEntityException(
        'No se permite modificar el inventario asociado al producto',
      );
    }

    // 2. Validación del producto existente y estado
    const product = await this.findOneEntity(id);

    if (product.status === ProductStatus.DISCONTINUED) {
      throw new ConflictException(
        'Un producto discontinuado no puede ser modificado',
      );
    }

    // 3. Validaciones combinadas de descuento (RN-P-005)
    const effectiveDiscount =
      updateProductDto.discount !== undefined
        ? updateProductDto.discount
        : product.discount;
    const effectiveDiscountEndsAt =
      updateProductDto.discountEndsAt !== undefined
        ? updateProductDto.discountEndsAt
        : product.discountEndsAt;

    if (effectiveDiscount && Number(effectiveDiscount) > 0) {
      if (!effectiveDiscountEndsAt) {
        throw new UnprocessableEntityException(
          'Debe proporcionar una fecha de fin para el descuento',
        );
      }
      const discountEndDate = new Date(effectiveDiscountEndsAt);
      if (isNaN(discountEndDate.getTime()) || discountEndDate < new Date()) {
        throw new UnprocessableEntityException(
          'La fecha de fin del descuento debe ser una fecha válida mayor a la fecha actual',
        );
      }
    }

    // Validaciones opcionales de arreglos si vienen en el DTO
    if (updateProductDto.imageUrls !== undefined) {
      const safeImageUrls = updateProductDto.imageUrls || [];
      if (safeImageUrls.length > 10) {
        throw new UnprocessableEntityException(
          'Se permite un máximo de 10 imágenes por producto',
        );
      }
    }

    if (updateProductDto.tags !== undefined) {
      const safeTags = updateProductDto.tags || [];
      if (safeTags.length > 20) {
        throw new UnprocessableEntityException(
          'Se permite un máximo de 20 etiquetas por producto',
        );
      }
    }

    if (updateProductDto.variantConfigs !== undefined) {
      const safeVariantConfigs = updateProductDto.variantConfigs || [];
      if (safeVariantConfigs.length > 0) {
        if (!product.inventoryId) {
          throw new UnprocessableEntityException(
            'El producto no tiene un inventario asociado para configurar variantes',
          );
        }

        for (const vc of safeVariantConfigs) {
          const detail = await this.dataSource
            .getRepository(InventoryDetail)
            .findOne({
              where: {
                id: vc.inventoryDetailId,
                inventoryId: product.inventoryId,
              },
            });

          if (!detail) {
            throw new UnprocessableEntityException(
              `La variante con ID ${vc.inventoryDetailId} no pertenece al inventario del producto`,
            );
          }
        }
      }
    }

    const actorId = user?.id ?? user?.userId ?? null;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Paso 1 — Actualizar products (partial merge)
      const updateData: any = {};
      if (updateProductDto.commercialName !== undefined) {
        updateData.commercialName = updateProductDto.commercialName;
      }
      if (updateProductDto.description !== undefined) {
        updateData.description = updateProductDto.description;
      }
      if (updateProductDto.salePrice !== undefined) {
        updateData.salePrice = updateProductDto.salePrice;
      }
      if (updateProductDto.discount !== undefined) {
        updateData.discount = updateProductDto.discount;
      }
      if (updateProductDto.discountEndsAt !== undefined) {
        updateData.discountEndsAt = updateProductDto.discountEndsAt
          ? new Date(updateProductDto.discountEndsAt)
          : null;
      }
      if (updateProductDto.status !== undefined) {
        updateData.status = updateProductDto.status;
      }
      if (actorId) {
        updateData.updatedById = actorId;
      }

      if (Object.keys(updateData).length > 0) {
        await queryRunner.manager.update(Product, { id }, updateData);
      }

      // Paso 2 — Actualizar imágenes (si imageUrls viene en DTO)
      if (updateProductDto.imageUrls !== undefined) {
        await queryRunner.manager.delete(ProductImage, { productId: id });
        const safeImageUrls = updateProductDto.imageUrls || [];
        if (safeImageUrls.length > 0) {
          const imageEntities = safeImageUrls.map((url, index) =>
            queryRunner.manager.create(ProductImage, {
              productId: id,
              imageUrl: url,
              sortOrder: index,
            }),
          );
          await queryRunner.manager.save(ProductImage, imageEntities);
        }
      }

      // Paso 3 — Actualizar etiquetas (si tags viene en DTO)
      if (updateProductDto.tags !== undefined) {
        await queryRunner.manager.delete(ProductTag, { productId: id });
        const safeTags = updateProductDto.tags || [];
        const deduplicatedTags = Array.from(
          new Set(safeTags.map((t) => t.trim())),
        ).filter((t) => t.length > 0);

        if (deduplicatedTags.length > 0) {
          const tagEntities = deduplicatedTags.map((tag) =>
            queryRunner.manager.create(ProductTag, {
              productId: id,
              tag,
            }),
          );
          await queryRunner.manager.save(ProductTag, tagEntities);
        }
      }

      // Paso 4 — Actualizar variantes (si variantConfigs viene en DTO)
      if (updateProductDto.variantConfigs !== undefined) {
        await queryRunner.manager.delete(ProductVariantConfig, {
          productId: id,
        });
        const safeVariantConfigs = updateProductDto.variantConfigs || [];

        if (safeVariantConfigs.length > 0) {
          const variantEntities = safeVariantConfigs.map((vc) =>
            queryRunner.manager.create(ProductVariantConfig, {
              productId: id,
              inventoryDetailId: vc.inventoryDetailId,
              minStock: vc.minStock,
            }),
          );
          await queryRunner.manager.save(ProductVariantConfig, variantEntities);

          // Paso 5 — Actualizar min_stock en inventory_details
          for (const vc of safeVariantConfigs) {
            await queryRunner.manager.update(
              InventoryDetail,
              { id: vc.inventoryDetailId },
              { minStock: vc.minStock },
            );
          }
        }
      }

      await queryRunner.commitTransaction();

      const updatedProduct = await this.findOneEntity(id);
      return ProductResponseDto.fromEntity(updatedProduct);
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Error en transacción T7-2 al actualizar producto con ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateProductStatusDto,
    user?: any,
  ): Promise<ProductResponseDto> {
    const product = await this.findOneEntity(id);
    const currentStatus = product.status;
    const newStatus = updateStatusDto.status;

    // Validación de máquina de estados
    const allowedTransitions = PRODUCT_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new ConflictException(
        `La transición ${currentStatus} → ${newStatus} no está permitida`,
      );
    }

    // Activación del producto: verificar stock de inventario
    if (newStatus === ProductStatus.ACTIVE && product.inventoryId) {
      const inventory = await this.dataSource
        .getRepository(Inventory)
        .findOne({ where: { id: product.inventoryId } });

      if (inventory && inventory.status === InventoryStatus.OUT_OF_STOCK) {
        throw new ConflictException(
          'El inventario seleccionado no tiene stock disponible',
        );
      }
    }

    const actorId = user?.id ?? user?.userId ?? null;

    // Descontinuación del producto: Soft Delete atómico
    if (newStatus === ProductStatus.DISCONTINUED) {
      await this.productRepository.update(
        { id },
        {
          status: newStatus,
          deletedAt: new Date(),
          updatedById: actorId,
        },
      );
    } else {
      await this.productRepository.update(
        { id },
        {
          status: newStatus,
          updatedById: actorId,
        },
      );
    }

    const updatedProduct = await this.findOneEntityWithDeleted(id);
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  async findOneEntity(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'images',
        'tags',
        'variantConfigs',
        'variantConfigs.inventoryDetail',
        'inventory',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  async findOneEntityWithDeleted(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: [
        'images',
        'tags',
        'variantConfigs',
        'variantConfigs.inventoryDetail',
        'inventory',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.findOneEntity(id);
    return ProductResponseDto.fromEntity(product);
  }

  async findAll(
    filterDto: ProductFilterDto,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const {
      limit = 10,
      page = 1,
      search,
      minPrice,
      maxPrice,
      status,
      sortBy = 'createdAt',
      order = SortOrder.DESC,
    } = filterDto;

    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.tags', 'tags')
      .leftJoinAndSelect('product.variantConfigs', 'variantConfigs')
      .leftJoinAndSelect(
        'variantConfigs.inventoryDetail',
        'inventoryDetail',
      )
      .leftJoinAndSelect('product.inventory', 'inventory');

    if (search) {
      const fromChars = 'áéíóúäëïöüàèìòù';
      const toChars = 'aeiouaeiouaeiou';
      query.andWhere(
        `(translate(LOWER(product.commercialName), :fromChars, :toChars) LIKE translate(LOWER(:search), :fromChars, :toChars) OR 
          translate(LOWER(product.description), :fromChars, :toChars) LIKE translate(LOWER(:search), :fromChars, :toChars))`,
        { search: `%${search}%`, fromChars, toChars },
      );
    }

    if (minPrice !== undefined) {
      query.andWhere('product.salePrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.salePrice <= :maxPrice', { maxPrice });
    }

    if (status) {
      query.andWhere('product.status = :status', { status });
    }

    query.orderBy(`product.${sortBy}`, order);
    query.take(limit).skip(skip);

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((p) => ProductResponseDto.fromEntity(p)),
      total,
      page,
      limit,
    };
  }

  async remove(id: string): Promise<ProductResponseDto> {
    const product = await this.findOneEntity(id);
    const softRemoved = await this.productRepository.softRemove(product);
    return ProductResponseDto.fromEntity(softRemoved);
  }
}