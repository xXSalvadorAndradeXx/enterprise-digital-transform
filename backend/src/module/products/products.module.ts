import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductTag } from './entities/product-tag.entity';
import { ProductVariantConfig } from './entities/product-variant-config.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { EcommerceProductsController } from './ecommerce-products.controller';
import { UsersModule } from '../users/users.module';
import { InventoryModule } from '../inventory/inventory.module';
import { CartModule } from '../cart/cart.module';
import { BranchesModule } from '../branches/branches.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductTag,
      ProductVariantConfig,
    ]),
    UsersModule,
    InventoryModule,
    CartModule,
    BranchesModule,
    CategoriesModule,
  ],
  controllers: [ProductsController, EcommerceProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}