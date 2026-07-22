import { Controller, Get, Post, Patch, Delete, UseGuards, Request, Query, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const { user, temporaryPassword } = await this.usersService.create(createUserDto);
    const serializedUser = plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario creado exitosamente',
      data: {
        user: serializedUser,
        temporaryPassword,
      },
    };
  }

  @UseGuards(JwtAuthGuard) 
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: '¡Acceso exitoso a la ruta protegida!',
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() query: FindUsersQueryDto) {
    const { page, limit, ...filters } = query;
    const { users, meta } = await this.usersService.findAll(page, limit, filters);
    const serializedUsers = plainToInstance(UserResponseDto, users, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users: serializedUsers,
        meta,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.findOne(id);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario obtenido exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/roles')
  async assignRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    const result = await this.usersService.assignRoles(id, assignRolesDto);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Roles asignados exitosamente',
      data: serializedUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.usersService.remove(id);
    const serializedUser = plainToInstance(UserResponseDto, result, { excludeExtraneousValues: true });
    return {
      status: 'success',
      message: 'Usuario eliminado exitosamente',
      data: serializedUser,
    };
  }
}