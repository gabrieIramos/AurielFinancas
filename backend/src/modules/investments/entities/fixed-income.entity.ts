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

// Tipos de renda fixa
export type FixedIncomeType = 
  | 'CDB'
  | 'LCI'
  | 'LCA'
  | 'TESOURO_SELIC'
  | 'TESOURO_PREFIXADO'
  | 'TESOURO_IPCA'
  | 'LC'
  | 'DEBENTURE'
  | 'CRI'
  | 'CRA'
  | 'POUPANCA';

// Tipos de indexador
export type IndexerType = 'CDI' | 'SELIC' | 'IPCA' | 'PREFIXADO' | 'POUPANCA';

@Entity('fixed_income_investments')
export class FixedIncomeInvestment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: FixedIncomeType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  institution: string;

  @Column({
    name: 'invested_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
  })
  investedAmount: number;

  @Column({
    name: 'current_amount',
    type: 'decimal',
    precision: 18,
    scale: 2,
    nullable: true,
  })
  currentAmount: number;

  @Column({
    name: 'interest_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
  })
  interestRate: number;

  @Column({
    name: 'indexer',
    type: 'varchar',
    length: 20,
  })
  indexer: IndexerType;

  @Column({
    name: 'purchase_date',
    type: 'date',
  })
  purchaseDate: Date;

  @Column({
    name: 'maturity_date',
    type: 'date',
    nullable: true,
  })
  maturityDate: Date;

  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
