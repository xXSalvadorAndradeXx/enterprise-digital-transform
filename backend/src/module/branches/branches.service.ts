import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({ where: { id, isActive: true } });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada o inactiva`);
    }
    return branch;
  }
}
