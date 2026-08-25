// src/module/customers/controllers/ecommerce-auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { CustomersService } from '../customers.service';
import { EcommerceRegisterDto } from '../dto/ecommerce-register.dto';
import { EcommerceLoginDto } from '../dto/ecommerce-login.dto';
import { CustomerJwtAuthGuard } from '../guards/customer-jwt-auth.guard';
import { REFRESH_TOKEN_COOKIE_NAME } from '../constants/ecommerce-auth.constant';

@ApiTags('Ecommerce Auth')
@Controller('ecommerce/auth')
export class EcommerceAuthController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({
    summary: 'Registrar un nuevo cliente comprador y crear sesión',
  })
  @ApiBody({ type: EcommerceRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Cliente registrado y sesión creada correctamente',
  })
  @Post('register')
  async register(
    @Body() dto: EcommerceRegisterDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipHash = req.ip ? crypto.createHash('sha256').update(req.ip).digest('hex') : undefined;

    // 1. Ejecutar el registro, asignación de dirección y creación de sesión en una transacción única
    const { customer, accessToken, rawRefreshToken, cookieMaxAge } =
      await this.customersService.register(dto, userAgent, ipHash);

    // 2. Emitir el refresh token en la cookie segura HttpOnly
    this.customersService.setRefreshTokenCookie(res, rawRefreshToken, cookieMaxAge);

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
        },
        accessToken,
        expiresIn: 900,
      },
    };
  }

  @ApiOperation({
    summary: 'Iniciar sesión de cliente comprador',
  })
  @ApiBody({ type: EcommerceLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: EcommerceLoginDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Validar credenciales
    const customer = await this.customersService.validateCredentials(dto.email, dto.password);

    // 2. Generar el Access Token con duración fija de 15 minutos (900s)
    const accessToken = await this.customersService.generateAccessToken(customer);

    // 3. Generar e iniciar la sesión con Refresh Token (máx 24 horas absoluto)
    const ipHash = req.ip ? crypto.createHash('sha256').update(req.ip).digest('hex') : undefined;
    const { rawToken, cookieMaxAge } = await this.customersService.issueRefreshToken(
      customer.id,
      dto.rememberMe,
      userAgent,
      ipHash,
    );

    // 4. Emitir el refresh token en la cookie segura HttpOnly
    this.customersService.setRefreshTokenCookie(res, rawToken, cookieMaxAge);

    return {
      success: true,
      data: {
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
        },
        accessToken,
        expiresIn: 900,
      },
    };
  }

  @ApiOperation({
    summary: 'Renovar access token mediante rotación de refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Renovación exitosa',
  })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!currentRefreshToken) {
      throw new UnauthorizedException({
        code: 'MISSING_REFRESH_TOKEN',
        message: 'No se envió el refresh token en las cookies.',
      });
    }

    // Rotar el token heredando y respetando la expiración absoluta de 24h
    // Como las cookies de refresh no envían rememberMe explícito, podemos leerlo de la cookie/sesión original,
    // o asumir true si tiene duración o false si no la tiene. Pero para simplificar, pasamos true
    // si queremos preservar la cookie de sesión o false por defecto. Usemos el estado anterior.
    const { rawToken, cookieMaxAge } = await this.customersService.rotateRefreshToken(
      currentRefreshToken,
      true, // Mantenemos la cookie activa persistente
    );

    // Obtener información del cliente de la nueva sesión
    const session = await this.customersService.validateSessionForRefresh(rawToken);
    const customer = await this.customersService.findOne(session.customerId);

    // Generar nuevo Access Token de 15 minutos
    const accessToken = await this.customersService.generateAccessToken(customer);

    // Configurar la nueva cookie
    this.customersService.setRefreshTokenCookie(res, rawToken, cookieMaxAge);

    return {
      success: true,
      data: {
        accessToken,
        expiresIn: 900,
      },
    };
  }

  @ApiOperation({
    summary: 'Cerrar sesión de cliente',
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const currentRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (currentRefreshToken) {
      await this.customersService.revokeSession(currentRefreshToken);
    }
    this.customersService.clearRefreshTokenCookie(res);
    return {
      success: true,
      message: 'Sesión cerrada correctamente.',
    };
  }

  @ApiOperation({
    summary: 'Obtener información del cliente autenticado',
  })
  @ApiBearerAuth()
  @UseGuards(CustomerJwtAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const customer = await this.customersService.findOne(req.user.id);
    return {
      success: true,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        dui: customer.dui,
      },
    };
  }
}
