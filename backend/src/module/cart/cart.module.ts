import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariantConfig } from '../products/entities/product-variant-config.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, ProductVariantConfig]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}