import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { Department } from './entities/department.entity';
import { District } from './entities/district.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Branch, Department, District])],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
