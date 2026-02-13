import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiCategoryCache } from './entities/ai-category-cache.entity';
import { UserMemory } from './entities/user-memory.entity';
import { Category } from '../categories/entities/category.entity';
import { UsersModule } from '../users/users.module';
import { MemoryService } from './memory.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AiCategoryCache, UserMemory, Category]),
    UsersModule,
  ],
  controllers: [AiController],
  providers: [AiService, MemoryService],
  exports: [AiService, MemoryService],
})
export class AiModule {}
