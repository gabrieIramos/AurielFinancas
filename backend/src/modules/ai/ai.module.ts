import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiCategoryCache } from './entities/ai-category-cache.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AiCategoryCache, Category]),
  ],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
