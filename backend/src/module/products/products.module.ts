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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductImage,
      ProductTag,
      ProductVariantConfig,
    ]),
    UsersModule,
  ],
  controllers: [ProductsController, EcommerceProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}