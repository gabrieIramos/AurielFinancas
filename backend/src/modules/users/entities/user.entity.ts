import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Investment } from '../../investments/entities/investment.entity';
import { NetWorthHistory } from '../../net-worth/entities/net-worth-history.entity';

// Tabela "user" do BetterAuth - usando mesma estrutura
@Entity('user')
export class User {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ name: 'emailVerified', type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ name: 'fullName', type: 'text', nullable: true })
  fullName: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp with time zone', nullable: true })
  updatedAt: Date;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Investment, (investment) => investment.user)
  investments: Investment[];

  @OneToMany(() => NetWorthHistory, (netWorth) => netWorth.user)
  netWorthHistory: NetWorthHistory[];
}
