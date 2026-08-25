import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { BranchQueryDto } from './dto/branch-query.dto';
import { PublicBranchResponseDto } from './dto/public-branch-response.dto';

@ApiTags('Catálogo de Sucursales')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Obtener catálogo público de sucursales activas (Filtrado opcional por allowsPickup=true para retiro en tienda)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sucursales obtenida exitosamente',
    type: [PublicBranchResponseDto],
  })
  async findAll(
    @Query() queryDto: BranchQueryDto,
  ): Promise<PublicBranchResponseDto[]> {
    return this.branchesService.findAllPublic(queryDto);
  }
}
