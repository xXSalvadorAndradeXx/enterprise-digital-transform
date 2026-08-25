import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Inventory } from './inventory.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';

@Entity('inventory_reservations')
@Index(['orderId', 'status'])
export class InventoryReservation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'uuid-de-la-orden' })
  @Index()
  @Column({ name: 'order_id', type: 'uuid', nullable: false })
  orderId!: string;

  @ApiProperty({ example: 'uuid-de-la-variante-o-producto' })
  @Index()
  @Column({ name: 'product_id', type: 'uuid', nullable: false })
  productId!: string;

  @ApiProperty({ type: () => Inventory })
  @ManyToOne(() => Inventory, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'inventory_id' })
  inventory!: Inventory;

  @Index()
  @Column({ name: 'inventory_id', type: 'uuid', nullable: false })
  inventoryId!: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'integer', nullable: false, default: 0 })
  quantity!: number;

  @ApiProperty({ enum: ReservationStatus, default: ReservationStatus.ACTIVE })
  @Index()
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.ACTIVE,
  })
  status!: ReservationStatus;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
