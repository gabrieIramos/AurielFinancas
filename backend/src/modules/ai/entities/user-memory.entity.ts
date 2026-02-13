import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('user_memory')
@Index(['userId', 'createdAt'])
export class UserMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'text' })
  @Index()
  userId: string;

  // Fato relevante extraído da conversa
  @Column({ type: 'text' })
  fact: string;

  // Categoria do fato (finance, personal, goal, emergency, debt, etc)
  @Column({ type: 'text' })
  category: string;

  // Contexto adicional se necessário
  @Column({ type: 'text', nullable: true })
  context: string;

  // Score de relevância (0-100)
  @Column({ type: 'integer', default: 50 })
  relevance: number;

  // Sentimento associado (positive, negative, neutral)
  @Column({ type: 'text', nullable: true })
  sentiment: string;

  // Data em que o fato ocorreu/foi mencionado
  @Column({ name: 'event_date', type: 'timestamp with time zone', nullable: true })
  eventDate: Date;

  // Se o fato ainda é relevante (pode ser marcado como resolvido)
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
