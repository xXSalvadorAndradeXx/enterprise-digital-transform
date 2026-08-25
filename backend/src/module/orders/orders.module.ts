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
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryReservation } from '../inventory/entities/inventory-reservation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';

import { AdminOrdersController } from './admin-orders.controller';

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
      Inventory,
      InventoryReservation,
      InventoryMovement,
    ]),
  ],
  controllers: [OrdersController, EcommerceCheckoutController, AdminOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}



