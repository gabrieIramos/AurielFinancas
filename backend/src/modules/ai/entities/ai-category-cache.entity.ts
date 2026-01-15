import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('ai_category_cache')
export class AiCategoryCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'description_clean', type: 'text', unique: true })
  descriptionClean: string;

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

  @Column({ name: 'is_global', type: 'boolean', default: false })
  isGlobal: boolean;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Category, (category) => category.aiCaches, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
