import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('net_worth_history')
@Unique(['userId', 'snapshotDate'])
export class NetWorthHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'snapshot_date', type: 'date' })
  snapshotDate: Date;

  @Column({ name: 'total_assets', type: 'decimal', precision: 15, scale: 2 })
  totalAssets: number;

  @Column({
    name: 'total_liabilities',
    type: 'decimal',
    precision: 15,
    scale: 2,
  })
  totalLiabilities: number;

  @Column({ name: 'net_worth', type: 'decimal', precision: 15, scale: 2 })
  netWorth: number;

  @ManyToOne(() => User, (user) => user.netWorthHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
