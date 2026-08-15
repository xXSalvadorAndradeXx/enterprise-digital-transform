import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductFilterDto } from './dto/product-filter.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SingleResponse } from '../common/interfaces/api-response.interface';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query() filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    return this.productsService.findAll(filterDto);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.findOne(id);
    return { data: product };
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // Máximo 5 MB
      },
      fileFilter: (req, file, callback) => {
        const allowedMimetypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedMimetypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Formato de archivo no permitido. Solo se permiten imágenes PNG y JPEG',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen PNG o JPEG (máx. 5 MB)',
        },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    return this.productsService.uploadProductImage(file);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:create')
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.create(createProductDto, user);
    return { data: product };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.update(id, updateProductDto, user);
    return { data: product };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:update')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateProductStatusDto,
    @CurrentUser() user: any,
  ): Promise<SingleResponse<ProductResponseDto>> {
    const product = await this.productsService.updateStatus(id, updateStatusDto, user);
    return { data: product };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products:delete')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.productsService.remove(id, user);
  }
}