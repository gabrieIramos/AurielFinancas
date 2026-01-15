import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from './entities/institution.entity';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
  ) {}

  async findAll(): Promise<Institution[]> {
    return this.institutionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async create(name: string, bankCode?: string): Promise<Institution> {
    const institution = this.institutionRepository.create({ name, bankCode });
    return this.institutionRepository.save(institution);
  }
}
