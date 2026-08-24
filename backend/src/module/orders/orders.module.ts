import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { EcommerceCheckoutController } from './ecommerce-checkout.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDelivery } from './entities/order-delivery.entity';
import { GuestCustomer } from './entities/guest-customer.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Product } from '../products/entities/product.entity';
import { CheckoutIdempotency } from './entities/checkout-idempotency.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderDelivery,
      GuestCustomer,
      OrderStatusHistory,
      User,
      Branch,
      Product,
      CheckoutIdempotency,
    ]),
  ],
  controllers: [OrdersController, EcommerceCheckoutController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}



