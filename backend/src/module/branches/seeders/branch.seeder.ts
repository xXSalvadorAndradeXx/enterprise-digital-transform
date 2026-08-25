import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../entities/branch.entity';
import { Department } from '../entities/department.entity';
import { District } from '../entities/district.entity';

@Injectable()
export class BranchSeeder {
  private readonly logger = new Logger(BranchSeeder.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Iniciando seed idempotente de Departamentos, Distritos y Sucursales...');

    // 1. Departamentos
    let dept = await this.departmentRepository.findOne({ where: { code: 'SS' } });
    if (!dept) {
      dept = this.departmentRepository.create({
        id: 1,
        name: 'San Salvador',
        code: 'SS',
        isActive: true,
      });
      dept = await this.departmentRepository.save(dept);
      this.logger.log(`Departamento creado: ${dept.name}`);
    }

    // 2. Distritos
    let dist = await this.districtRepository.findOne({ where: { id: 1 } });
    if (!dist) {
      dist = this.districtRepository.create({
        id: 1,
        name: 'San Salvador Centro',
        departmentId: dept.id,
        isActive: true,
      });
      dist = await this.districtRepository.save(dist);
      this.logger.log(`Distrito creado: ${dist.name}`);
    }

    // 3. Sucursales
    const branchesData = [
      {
        code: 'SUC-001',
        name: 'Sucursal Central Escalón',
        address: 'Paseo General Escalón #1234, San Salvador',
        phone: '2222-0000',
        isActive: true,
        allowsPickup: true,
        departmentId: dept.id,
        districtId: dist.id,
      },
      {
        code: 'SUC-002',
        name: 'Sucursal Bodega Soyapango',
        address: 'Km 5 Carretera Panamericana, Soyapango',
        phone: '2222-1111',
        isActive: true,
        allowsPickup: false,
        departmentId: dept.id,
        districtId: dist.id,
      },
      {
        code: 'SUC-003',
        name: 'Sucursal Inactiva Pruebas',
        address: 'Centro Comercial Antiguo Cima',
        phone: '2222-9999',
        isActive: false,
        allowsPickup: true,
        departmentId: dept.id,
        districtId: dist.id,
      },
    ];

    for (const data of branchesData) {
      let branch = await this.branchRepository.findOne({ where: { code: data.code } });
      if (!branch) {
        branch = this.branchRepository.create(data);
        await this.branchRepository.save(branch);
        this.logger.log(`Sucursal creada [${data.code}]: ${data.name} (pickup: ${data.allowsPickup})`);
      } else {
        branch.name = data.name;
        branch.address = data.address;
        branch.phone = data.phone;
        branch.isActive = data.isActive;
        branch.allowsPickup = data.allowsPickup;
        branch.departmentId = data.departmentId;
        branch.districtId = data.districtId;
        await this.branchRepository.save(branch);
      }
    }

    this.logger.log('Seed de Sucursales finalizado exitosamente.');
  }
}
