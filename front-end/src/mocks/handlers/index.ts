import type { RequestHandler } from "msw";

import { authHandlers } from "./auth.handlers";
import { locationHandlers } from "./locations.handlers";

/**
 * Registra aquí los handlers de cada dominio mientras el backend no esté listo.
 * Ejemplo: ...productHandlers, ...authHandlers, ...cartHandlers.
 */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...locationHandlers,
];
