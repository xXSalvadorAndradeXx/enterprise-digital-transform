import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Product,
    ]),
    AuthModule,
  ],

  controllers: [CartController],

  providers: [CartService],

  exports: [CartService],
})
export class CartModule {}