import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('ai_category_cache')
@Index(['descriptionClean', 'userId'], { unique: true }) // Índice composto único
export class AiCategoryCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'description_clean', type: 'text' })
  descriptionClean: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null; // null = cache global, preenchido = cache do usuário

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({
    name: 'confidence_score',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  confidenceScore: number;

  @Column({ name: 'occurrence_count', type: 'integer', default: 1 })
  occurrenceCount: number;

  @Column({ name: 'is_user_defined', type: 'boolean', default: false })
  isUserDefined: boolean; // true = usuário definiu manualmente (maior confiança)

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.aiCaches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
