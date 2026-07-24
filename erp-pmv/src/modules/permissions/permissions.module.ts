import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './dto/permission.entity';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';

/**
 * PermissionsModule — módulo autocontenido de permisos atómicos.
 * Exporta PermissionsService para ser usado por RolesModule y AuthModule.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}