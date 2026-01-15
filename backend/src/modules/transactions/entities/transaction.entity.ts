import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('transactions')
@Index('idx_trans_recon_search', ['amount', 'date', 'userId'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @Column({ type: 'text', nullable: true })
  fitid: string;

  @Column({ name: 'transaction_hash', type: 'text', unique: true })
  transactionHash: string;

  @Column({ name: 'description_raw', type: 'text' })
  descriptionRaw: string;

  @Column({ name: 'description_clean', type: 'text', nullable: true })
  descriptionClean: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string;

  @Column({
    name: 'category_confidence',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  categoryConfidence: number;

  @Column({ name: 'needs_review', type: 'boolean', default: true })
  needsReview: boolean;

  @Column({ name: 'transfer_id', type: 'uuid', nullable: true })
  transferId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Account, (account) => account.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ManyToOne(() => Category, (category) => category.transactions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Transaction, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transaction;
}
