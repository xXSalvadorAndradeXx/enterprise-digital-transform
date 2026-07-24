import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador de parámetro que extrae el usuario autenticado del request.
 * Poblado por JwtStrategy después de validar el access token.
 *
 * TDD § 2.5 — @CurrentUser() extrae request.user ya validado.
 *
 * Uso: findAll(@CurrentUser() user: JwtPayload)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);