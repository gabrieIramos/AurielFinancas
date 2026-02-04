import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_financial_profile')
export class UserFinancialProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'text' })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Dados básicos
  @Column({ name: 'age_range', type: 'text', nullable: true })
  ageRange: string;

  @Column({ type: 'text', nullable: true })
  occupation: string;

  // Renda
  @Column({ name: 'monthly_income_range', type: 'text', nullable: true })
  monthlyIncomeRange: string;

  @Column({ name: 'income_stability', type: 'text', nullable: true })
  incomeStability: string;

  // Despesas e dívidas
  @Column({ name: 'monthly_expense_percentage', type: 'text', nullable: true })
  monthlyExpensePercentage: string;

  @Column({ name: 'has_debts', type: 'boolean', default: false })
  hasDebts: boolean;

  @Column({ name: 'debt_types', type: 'text', array: true, nullable: true })
  debtTypes: string[];

  // Reserva de emergência
  @Column({ name: 'has_emergency_fund', type: 'boolean', default: false })
  hasEmergencyFund: boolean;

  @Column({ name: 'emergency_fund_months', type: 'text', nullable: true })
  emergencyFundMonths: string;

  // Investimentos
  @Column({ name: 'investment_experience', type: 'text', nullable: true })
  investmentExperience: string;

  @Column({ name: 'current_investments', type: 'text', array: true, nullable: true })
  currentInvestments: string[];

  @Column({ name: 'investment_goal', type: 'text', nullable: true })
  investmentGoal: string;

  @Column({ name: 'investment_horizon', type: 'text', nullable: true })
  investmentHorizon: string;

  // Perfil de risco
  @Column({ name: 'risk_tolerance', type: 'text', nullable: true })
  riskTolerance: string;

  // Objetivos
  @Column({ name: 'main_financial_goals', type: 'text', array: true, nullable: true })
  mainFinancialGoals: string[];

  @Column({ name: 'biggest_financial_challenge', type: 'text', nullable: true })
  biggestFinancialChallenge: string;

  // Meta
  @Column({ name: 'profile_completed', type: 'boolean', default: false })
  profileCompleted: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
