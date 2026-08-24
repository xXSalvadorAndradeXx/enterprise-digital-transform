import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { District } from './entities/district.entity';
import { BranchQueryDto } from './dto/branch-query.dto';
import { PublicBranchResponseDto } from './dto/public-branch-response.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  async findAll(): Promise<Branch[]> {
    return await this.branchRepository.find({
      relations: ['department', 'district'],
    });
  }

  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['department', 'district'],
    });
    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada`);
    }
    return branch;
  }

  async validateDepartmentDistrict(
    departmentId: number,
    districtId: number,
  ): Promise<{ department: Department; district: District }> {
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId, isActive: true },
    });

    if (!department) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION',
        message: `El departamento con ID ${departmentId} no existe o no está activo`,
      });
    }

    const district = await this.districtRepository.findOne({
      where: { id: districtId, isActive: true },
    });

    if (!district) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION',
        message: `El distrito con ID ${districtId} no existe o no está activo`,
      });
    }

    if (Number(district.departmentId) !== Number(departmentId)) {
      throw new BadRequestException({
        code: 'INVALID_LOCATION',
        message: `El distrito con ID ${districtId} no pertenece al departamento con ID ${departmentId}`,
      });
    }

    return { department, district };
  }

  async findAllPublic(
    queryDto?: BranchQueryDto,
  ): Promise<PublicBranchResponseDto[]> {
    const query = this.branchRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.department', 'department')
      .leftJoinAndSelect('b.district', 'district')
      .where('b.is_active = :isActive', { isActive: true })
      .andWhere('b.deleted_at IS NULL');

    if (queryDto?.allowsPickup === true) {
      query.andWhere('b.allows_pickup = :allowsPickup', { allowsPickup: true });
    }

    query.orderBy('b.name', 'ASC');

    const branches = await query.getMany();
    return branches.map((b) => PublicBranchResponseDto.fromEntity(b));
  }
}
