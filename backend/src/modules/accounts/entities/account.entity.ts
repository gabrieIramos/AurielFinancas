import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Institution } from '../../institutions/entities/institution.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum AccountType {
  CONTA_CORRENTE = 'CONTA_CORRENTE',
  CARTAO_DE_CREDITO = 'CARTAO_DE_CREDITO',
  INVESTIMENTO = 'INVESTIMENTO',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'institution_id', type: 'uuid', nullable: true })
  institutionId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: AccountType,
  })
  type: AccountType;

  @Column({
    name: 'initial_balance',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? 0 : Number(value)),
    },
  })
  initialBalance: number;

  // Campo virtual para o saldo calculado (não persiste no banco)
  calculatedBalance?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Institution, (institution) => institution.accounts, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'institution_id' })
  institution: Institution;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];
}
