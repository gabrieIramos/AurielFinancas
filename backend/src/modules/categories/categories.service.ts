import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(name: string, color?: string): Promise<Category> {
    const category = this.categoryRepository.create({ name, color });
    return this.categoryRepository.save(category);
  }

  async seedDefaultCategories(): Promise<void> {
    const defaults = [
      { name: 'Alimentação', color: '#f59e0b' },
      { name: 'Transporte', color: '#3b82f6' },
      { name: 'Saúde', color: '#10b981' },
      { name: 'Lazer', color: '#8b5cf6' },
      { name: 'Educação', color: '#ec4899' },
      { name: 'Moradia', color: '#ef4444' },
      { name: 'Assinaturas', color: '#f97316' },
      { name: 'Compras', color: '#06b6d4' },
      { name: 'Receita', color: '#22c55e' },
      { name: 'Investimentos', color: '#14b8a6' },
      { name: 'Taxas', color: '#dc2626' },
      { name: 'Outras', color: '#808080' },
    ];

    for (const cat of defaults) {
      const exists = await this.categoryRepository.findOne({
        where: { name: cat.name },
      });
      if (!exists) {
        await this.create(cat.name, cat.color);
      }
    }
  }
}
