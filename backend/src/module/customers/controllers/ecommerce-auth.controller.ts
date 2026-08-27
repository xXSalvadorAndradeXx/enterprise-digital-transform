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
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
    description:
      'Crea una nueva cuenta de cliente e-commerce, asigna su dirección principal y genera un Access Token en el cuerpo JSON junto a una cookie HttpOnly para el Refresh Token.',
  })
  @ApiBody({ type: EcommerceRegisterDto })
  @ApiCreatedResponse({
    description: 'Cliente registrado y sesión creada correctamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            customer: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1' },
                fullName: { type: 'string', example: 'Carlos Eduardo Gómez' },
                email: { type: 'string', example: 'carlos.gomez@correo.com' },
                phone: { type: 'string', example: '+50371234567' },
                dui: { type: 'string', example: '01234567-8' },
              },
            },
            expiresIn: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Error de validación en los datos de registro (VALIDATION_ERROR)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            message: { type: 'string', example: 'Los datos enviados no son válidos' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  errors: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['El formato del correo es inválido'],
                  },
                },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2026-08-26T19:53:00.000Z' },
      },
    },
  })
  @ApiConflictResponse({
    description: 'El correo o DUI ya se encuentra registrado (EMAIL_ALREADY_EXISTS / DUI_ALREADY_EXISTS)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'EMAIL_ALREADY_EXISTS' },
            message: { type: 'string', example: 'El correo electrónico ya está registrado por otro cliente activo' },
            details: { type: 'object', example: { email: 'carlos.gomez@correo.com' } },
          },
        },
        timestamp: { type: 'string', example: '2026-08-26T19:53:00.000Z' },
      },
    },
  })
  @Post('register')
  async register(
    @Body() dto: EcommerceRegisterDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipHash = req.ip ? crypto.createHash('sha256').update(req.ip).digest('hex') : undefined;

    const { customer, accessToken, rawRefreshToken, cookieMaxAge } =
      await this.customersService.register(dto, userAgent, ipHash);

    this.customersService.setRefreshTokenCookie(res, rawRefreshToken, cookieMaxAge);

    return {
      success: true,
      data: {
        accessToken,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          dui: customer.dui,
        },
        expiresIn: 900,
      },
    };
  }

  @ApiOperation({
    summary: 'Iniciar sesión de cliente comprador',
    description:
      'Autentica un cliente e-commerce mediante email y contraseña, retornando el Access Token en el JSON y estableciendo el Refresh Token en cookie HttpOnly.',
  })
  @ApiBody({ type: EcommerceLoginDto })
  @ApiOkResponse({
    description: 'Inicio de sesión exitoso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            customer: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'd3b07384-d113-49cd-a5d6-8c4d5865dec1' },
                fullName: { type: 'string', example: 'Carlos Eduardo Gómez' },
                email: { type: 'string', example: 'carlos.gomez@correo.com' },
                phone: { type: 'string', example: '+50371234567' },
                dui: { type: 'string', example: '01234567-8' },
              },
            },
            expiresIn: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas (INVALID_CREDENTIALS)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string', example: 'INVALID_CREDENTIALS' },
            message: { type: 'string', example: 'Las credenciales proporcionadas no son válidas' },
          },
        },
        timestamp: { type: 'string', example: '2026-08-26T19:53:00.000Z' },
      },
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: EcommerceLoginDto,
    @Req() req: Request,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const customer = await this.customersService.validateCredentials(dto.email, dto.password);

    const accessToken = await this.customersService.generateAccessToken(customer);

    const ipHash = req.ip ? crypto.createHash('sha256').update(req.ip).digest('hex') : undefined;
    const { rawToken, cookieMaxAge } = await this.customersService.issueRefreshToken(
      customer.id,
      dto.rememberMe,
      userAgent,
      ipHash,
    );

    this.customersService.setRefreshTokenCookie(res, rawToken, cookieMaxAge);

    return {
      success: true,
      data: {
        accessToken,
        customer: {
          id: customer.id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          dui: customer.dui,
        },
        expiresIn: 900,
      },
    };
  }

  @ApiOperation({
    summary: 'Renovar access token mediante rotación de refresh token',
  })
  @ApiOkResponse({
    description: 'Renovación exitosa',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Sesión expirada o token revocado (SESSION_EXPIRED_OR_REVOKED)',
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
        code: 'SESSION_EXPIRED_OR_REVOKED',
        message: 'La sesión ha expirado o ya no es válida',
      });
    }

    try {
      const { rawToken, cookieMaxAge, customerId } = await this.customersService.rotateRefreshToken(
        currentRefreshToken,
        true,
      );

      const customer = await this.customersService.findOne(customerId);

      const accessToken = await this.customersService.generateAccessToken(customer);

      this.customersService.setRefreshTokenCookie(res, rawToken, cookieMaxAge);

      return {
        success: true,
        data: {
          accessToken,
          expiresIn: 900,
        },
      };
    } catch (error) {
      this.customersService.clearRefreshTokenCookie(res);
      throw error;
    }
  }

  @ApiOperation({
    summary: 'Cerrar sesión de cliente',
  })
  @ApiOkResponse({
    description: 'Sesión cerrada correctamente',
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
    
    if (!customer.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Acceso no autorizado.',
      });
    }

    return {
      success: true,
      data: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        dui: customer.dui,
      },
    };
  }
}
