import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, Not } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import * as fs from 'fs';
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
import { PublicProductResponseDto } from './dto/public-product-response.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import {
  PaginatedResponseDto,
  createPaginatedResponse,
} from '../../common/dto/paginated-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  private calcEffectivePrice(
    salePrice: number,
    discount: number | null,
    discountStartsAt?: Date | null,
    discountEndsAt?: Date | null,
  ): number {
    const price = Number(salePrice);
    const disc =
      discount !== null && discount !== undefined ? Number(discount) : 0;

    if (disc === 0) {
      return price;
    }

    if (discountStartsAt) {
      const startsAt = new Date(discountStartsAt);
      if (!isNaN(startsAt.getTime()) && startsAt > new Date()) {
        return price;
      }
    }

    if (discountEndsAt) {
      const endsAt = new Date(discountEndsAt);
      if (!isNaN(endsAt.getTime()) && endsAt < new Date()) {
        this.logger.warn(
          `Descuento de ${disc}% expiró el ${endsAt.toISOString()} para el producto con precio $${price}`,
        );
        return price;
      }
    }

    const effectivePrice = price * (1 - disc / 100);
    return Number(effectivePrice.toFixed(2));
  }

  private validateDiscountPeriod(
    discount: number | null | undefined,
    discountStartsAt?: string | Date | null,
    discountEndsAt?: string | Date | null,
  ): void {
    const discountValue = Number(discount ?? 0);
    const hasStartDate =
      discountStartsAt !== undefined && discountStartsAt !== null;
    const hasEndDate = discountEndsAt !== undefined && discountEndsAt !== null;

    if (discountValue <= 0) {
      if (hasStartDate || hasEndDate) {
        throw new UnprocessableEntityException(
          'Las fechas de descuento deben ser nulas cuando el descuento es 0',
        );
      }
      return;
    }

    if (!hasEndDate) {
      throw new UnprocessableEntityException(
        'Debe proporcionar una fecha de fin para el descuento',
      );
    }

    const endsAt = new Date(discountEndsAt);
    if (isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      throw new UnprocessableEntityException(
        'La fecha de fin del descuento debe ser una fecha válida mayor a la fecha actual',
      );
    }

    if (hasStartDate) {
      const startsAt = new Date(discountStartsAt);
      if (isNaN(startsAt.getTime()) || startsAt >= endsAt) {
        throw new UnprocessableEntityException(
          'La fecha de inicio del descuento debe ser válida y anterior a la fecha de fin',
        );
      }
    }
  }

  async uploadProductImage(
    file?: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo de imagen');
    }

    const fileExt = extname(file.originalname).toLowerCase();
    const fileName = `${randomUUID()}${fileExt}`;
    const uploadDir = join(process.cwd(), 'uploads', 'products');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const imageUrl = `http://localhost:3000/uploads/products/${fileName}`;

    return {
      data: {
        imageUrl,
        fileName,
        sizeBytes: file.size,
      },
      statusCode: 201,
    };
  }

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
      discountStartsAt,
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

    // Regla RN-P-005: Validaciones de descuento y vigencia.
    this.validateDiscountPeriod(discount, discountStartsAt, discountEndsAt);

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

        // Compatibilidad con borrados anteriores: un producto eliminado podía
        // conservar inventory_id y bloquear la restricción UNIQUE al reutilizar
        // el inventario. Liberamos únicamente relaciones de filas eliminadas.
        await queryRunner.manager.update(
          Product,
          {
            inventoryId,
            deletedAt: Not(IsNull()),
          },
          {
            inventoryId: null,
          },
        );

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
        discountStartsAt: discountStartsAt ? new Date(discountStartsAt) : null,
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
      return ProductResponseDto.fromEntity(
        createdProduct,
        this.calcEffectivePrice(
          createdProduct.salePrice,
          createdProduct.discount,
          createdProduct.discountStartsAt,
          createdProduct.discountEndsAt,
        ),
      );
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

    if (updateProductDto.status !== undefined) {
      throw new UnprocessableEntityException(
        'El estado debe actualizarse mediante PATCH /products/:id/status',
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
    const effectiveDiscountStartsAt =
      updateProductDto.discountStartsAt !== undefined
        ? updateProductDto.discountStartsAt
        : product.discountStartsAt;

    this.validateDiscountPeriod(
      effectiveDiscount,
      effectiveDiscountStartsAt,
      effectiveDiscountEndsAt,
    );

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
      if (updateProductDto.discountStartsAt !== undefined) {
        updateData.discountStartsAt = updateProductDto.discountStartsAt
          ? new Date(updateProductDto.discountStartsAt)
          : null;
      }
      if (updateProductDto.discountEndsAt !== undefined) {
        updateData.discountEndsAt = updateProductDto.discountEndsAt
          ? new Date(updateProductDto.discountEndsAt)
          : null;
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
      return ProductResponseDto.fromEntity(
        updatedProduct,
        this.calcEffectivePrice(
          updatedProduct.salePrice,
          updatedProduct.discount,
          updatedProduct.discountStartsAt,
          updatedProduct.discountEndsAt,
        ),
      );
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
          inventoryId: null,
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
    return ProductResponseDto.fromEntity(
      updatedProduct,
      this.calcEffectivePrice(
        updatedProduct.salePrice,
        updatedProduct.discount,
        updatedProduct.discountStartsAt,
        updatedProduct.discountEndsAt,
      ),
    );
  }

  async findOneEntity(id: string): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.inventory', 'inventory')
      .leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoinAndSelect('inventory.details', 'inventory_details')
      .leftJoinAndSelect('p.images', 'product_images')
      .leftJoinAndSelect('p.tags', 'product_tags')
      .leftJoinAndSelect('p.variantConfigs', 'product_variant_config')
      .leftJoinAndSelect(
        'product_variant_config.inventoryDetail',
        'inventoryDetail',
      )
      .where('p.id = :id', { id })
      .andWhere('p.deleted_at IS NULL')
      .getOne();

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  async findOneEntityWithDeleted(id: string): Promise<Product> {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .withDeleted()
      .leftJoinAndSelect('p.inventory', 'inventory')
      .leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoinAndSelect('inventory.details', 'inventory_details')
      .leftJoinAndSelect('p.images', 'product_images')
      .leftJoinAndSelect('p.tags', 'product_tags')
      .leftJoinAndSelect('p.variantConfigs', 'product_variant_config')
      .leftJoinAndSelect(
        'product_variant_config.inventoryDetail',
        'inventoryDetail',
      )
      .where('p.id = :id', { id })
      .getOne();

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return product;
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.findOneEntity(id);
    return ProductResponseDto.fromEntity(
      product,
      this.calcEffectivePrice(
        product.salePrice,
        product.discount,
        product.discountStartsAt,
        product.discountEndsAt,
      ),
    );
  }

  async findOnePublished(id: string): Promise<ProductResponseDto> {
    const product = await this.findOneEntity(id);
    if (product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    return ProductResponseDto.fromEntity(
      product,
      this.calcEffectivePrice(
        product.salePrice,
        product.discount,
        product.discountStartsAt,
        product.discountEndsAt,
      ),
    );
  }

  async findPublished(
    filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.findAll({ ...filterDto, status: ProductStatus.ACTIVE });
  }

  async findAll(
    filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const {
      limit = 10,
      page = 1,
      search,
      status,
      supplierId,
      categoryId,
      tag,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = SortOrder.DESC,
    } = filterDto;

    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.inventory', 'inventory')
      .leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoinAndSelect('p.images', 'product_images')
      .leftJoinAndSelect('p.tags', 'product_tags')
      .leftJoinAndSelect('p.variantConfigs', 'product_variant_config')
      .leftJoinAndSelect(
        'product_variant_config.inventoryDetail',
        'inventoryDetail',
      );

    // 1. Filtro de productos no eliminados por defecto
    query.andWhere('p.deleted_at IS NULL');

    // 2. Búsqueda textual parcial en commercial_name y description
    if (search) {
      query.andWhere('(p.commercial_name ILIKE :q OR p.description ILIKE :q)', {
        q: `%${search}%`,
      });
    }

    // 3. Filtro por estado & Regla RN-P-014 (Exclusión de DISCONTINUED por defecto)
    if (status) {
      query.andWhere('p.status = :status', { status });
    } else {
      query.andWhere('p.status != :discontinued', {
        discontinued: ProductStatus.DISCONTINUED,
      });
    }

    // 4. Filtros relacionados
    if (supplierId) {
      query.andWhere('inventory.supplier_id = :supplierId', { supplierId });
    }

    if (categoryId !== undefined) {
      query.andWhere('inventory.category_id = :categoryId', { categoryId });
    }

    if (tag) {
      query.andWhere('product_tags.tag = :tag', { tag });
    }

    // 5. Filtro por rango de precio
    if (minPrice !== undefined && maxPrice !== undefined) {
      if (minPrice > maxPrice) {
        throw new UnprocessableEntityException(
          'minPrice no puede ser mayor que maxPrice',
        );
      }
      query.andWhere('p.sale_price BETWEEN :minPrice AND :maxPrice', {
        minPrice,
        maxPrice,
      });
    } else if (minPrice !== undefined) {
      query.andWhere('p.sale_price >= :minPrice', { minPrice });
    } else if (maxPrice !== undefined) {
      query.andWhere('p.sale_price <= :maxPrice', { maxPrice });
    }

    // 6. Ordenamiento dinámico seguro (Whitelist)
    const sortFieldMap: Record<string, string> = {
      createdAt: 'p.createdAt',
      created_at: 'p.createdAt',

      salePrice: 'p.salePrice',
      sale_price: 'p.salePrice',

      commercialName: 'p.commercialName',
      commercial_name: 'p.commercialName',
    };

    const sortColumn = sortFieldMap[sortBy] ?? 'p.createdAt';
    const sortDirection = order === SortOrder.ASC ? 'ASC' : 'DESC';

    query.orderBy(sortColumn, sortDirection);
    query.skip(skip).take(limit);

    const [products, total] = await query.getManyAndCount();
    const data = products.map((p) =>
      ProductResponseDto.fromEntity(
        p,
        this.calcEffectivePrice(
          p.salePrice,
          p.discount,
          p.discountStartsAt,
          p.discountEndsAt,
        ),
      ),
    );

    return createPaginatedResponse(data, total, page, limit);
  }

  async remove(id: string, user?: any): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!product) {
      throw new NotFoundException(`Producto con id ${id} no encontrado`);
    }

    // Eliminación idempotente: si ya está eliminado por Soft Delete, retornar void
    if (product.deletedAt !== null) {
      return;
    }

    const actorId = user?.id ?? user?.userId ?? null;

    // Eliminación lógica atómica y liberación del inventario para que pueda
    // asociarse a un producto nuevo sin violar el índice UNIQUE.
    await this.productRepository.update(
      { id },
      {
        status: ProductStatus.DISCONTINUED,
        inventoryId: null,
        deletedAt: new Date(),
        updatedById: actorId,
      },
    );
  }

  async findEcommerceProducts(
    filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<PublicProductResponseDto>> {
    const {
      limit = 10,
      page = 1,
      search,
      supplierId,
      categoryId,
      tag,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      order = SortOrder.DESC,
    } = filterDto;

    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.inventory', 'inventory')
      .leftJoinAndSelect('inventory.category', 'category')
      .leftJoinAndSelect('inventory.supplier', 'supplier')
      .leftJoinAndSelect('p.images', 'product_images')
      .leftJoinAndSelect('p.tags', 'product_tags')
      .leftJoinAndSelect('p.variantConfigs', 'product_variant_config')
      .leftJoinAndSelect(
        'product_variant_config.inventoryDetail',
        'inventoryDetail',
      )
      .where('p.deleted_at IS NULL')
      .andWhere('p.status = :activeStatus', { activeStatus: ProductStatus.ACTIVE });

    if (search) {
      query.andWhere('(p.commercial_name ILIKE :q OR p.description ILIKE :q)', {
        q: `%${search}%`,
      });
    }

    if (supplierId) {
      query.andWhere('inventory.supplier_id = :supplierId', { supplierId });
    }

    if (categoryId !== undefined) {
      query.andWhere('inventory.category_id = :categoryId', { categoryId });
    }

    if (tag) {
      query.andWhere('product_tags.tag = :tag', { tag });
    }

    if (minPrice !== undefined) {
      query.andWhere('p.sale_price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('p.sale_price <= :maxPrice', { maxPrice });
    }

    const sortFieldMap: Record<string, string> = {
      createdAt: 'p.createdAt',
      created_at: 'p.createdAt',
      salePrice: 'p.salePrice',
      sale_price: 'p.salePrice',
      commercialName: 'p.commercialName',
      commercial_name: 'p.commercialName',
    };

    const sortColumn = sortFieldMap[sortBy] ?? 'p.createdAt';
    const sortDirection = order === SortOrder.ASC ? 'ASC' : 'DESC';

    query.orderBy(sortColumn, sortDirection);
    query.skip(skip).take(limit);

    const [products, total] = await query.getManyAndCount();
    const data = products.map((p) => {
      const effPrice = this.calcEffectivePrice(
        p.salePrice,
        p.discount,
        p.discountStartsAt,
        p.discountEndsAt,
      );
      const inStock = p.inventory ? p.inventory.status !== InventoryStatus.OUT_OF_STOCK : true;
      return PublicProductResponseDto.fromEntity(p, effPrice, inStock);
    });

    return createPaginatedResponse(data, total, page, limit);
  }

  async findEcommerceProductById(id: string): Promise<PublicProductResponseDto> {
    const product = await this.findOneEntity(id);
    if (product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException(
        `Producto con id ${id} no encontrado o no disponible en catálogo público`,
      );
    }

    const effPrice = this.calcEffectivePrice(
      product.salePrice,
      product.discount,
      product.discountStartsAt,
      product.discountEndsAt,
    );
    const inStock = product.inventory ? product.inventory.status !== InventoryStatus.OUT_OF_STOCK : true;

    return PublicProductResponseDto.fromEntity(product, effPrice, inStock);
  }
}
