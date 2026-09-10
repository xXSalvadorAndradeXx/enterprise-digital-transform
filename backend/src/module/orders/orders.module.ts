import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { EcommerceCheckoutController } from './ecommerce-checkout.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { CustomerOrdersController } from './controllers/customer-orders.controller';

import { OrdersService } from './orders.service';
import { CustomerOrdersService } from './services/customer-orders.service';
import { OrderEventsPublisherService } from './services/order-events-publisher.service';
import { OrderStatusNotificationListener } from './listeners/order-status-notification.listener';

import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderDelivery } from './entities/order-delivery.entity';
import { GuestCustomer } from './entities/guest-customer.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerAddress } from '../customers/entities/customer-address.entity';
import { CustomersModule } from '../customers/customers.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Branch } from '../branches/entities/branch.entity';
import { Product } from '../products/entities/product.entity';
import { CheckoutIdempotency } from './entities/checkout-idempotency.entity';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryReservation } from '../inventory/entities/inventory-reservation.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { ProductVariantConfig } from '../products/entities/product-variant-config.entity';

@Module({
  imports: [
    forwardRef(() => CustomersModule),
    NotificationsModule,
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderDelivery,
      GuestCustomer,
      OrderStatusHistory,
      Customer,
      CustomerAddress,
      Branch,
      Product,
      CheckoutIdempotency,
      Inventory,
      InventoryReservation,
      InventoryMovement,
      ProductVariantConfig,
    ]),
  ],
  controllers: [
    OrdersController,
    EcommerceCheckoutController,
    AdminOrdersController,
    CustomerOrdersController,
  ],
  providers: [
    OrdersService,
    CustomerOrdersService,
    OrderEventsPublisherService,
    OrderStatusNotificationListener,
  ],
  exports: [
    OrdersService,
    CustomerOrdersService,
    OrderEventsPublisherService,
    OrderStatusNotificationListener,
  ],
})
export class OrdersModule {}
