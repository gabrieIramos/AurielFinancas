import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Ativo } from './ativo.entity';

@Entity('investments')
export class Investment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'ativo_id', type: 'bigint' })
  ativoId: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, default: 0 })
  quantity: number;

  @Column({
    name: 'purchase_price',
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  purchasePrice: number;

  @Column({
    name: 'purchase_date',
    type: 'date',
  })
  purchaseDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.investments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Ativo, (ativo) => ativo.investments, { eager: true })
  @JoinColumn({ name: 'ativo_id' })
  ativo: Ativo;
}
