import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Department } from './department.entity';

@Entity('districts')
export class District {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Index()
  @Column({ name: 'department_id', type: 'integer', nullable: false })
  departmentId!: number;

  @ManyToOne(() => Department, (department) => department.districts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
