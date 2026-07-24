// src/modules/users/dto/assign-roles.dto.ts
import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRolesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];
}