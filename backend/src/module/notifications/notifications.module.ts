import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerNotification } from './entities/customer-notification.entity';
import { CustomerFavorite } from '../customers/entities/customer-favorite.entity';
import { CustomerNotificationsService } from './services/customer-notifications.service';
import { CustomerNotificationsController } from './controllers/customer-notifications.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerNotification, CustomerFavorite])],
  controllers: [CustomerNotificationsController],
  providers: [CustomerNotificationsService],
  exports: [TypeOrmModule, CustomerNotificationsService],
})
export class NotificationsModule {}
