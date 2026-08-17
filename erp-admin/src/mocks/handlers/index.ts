import type { RequestHandler } from "msw";
import { purchasesHandlers } from "./purchases.handlers";

/**
 * Registro central de handlers de MSW.
 *
 * Cada módulo debe mantener sus handlers en un archivo independiente,
 * por ejemplo:
 *
 * - auth.handlers.ts
 * - suppliers.handlers.ts
 * - purchases.handlers.ts
 * - inventory.handlers.ts
 * - users.handlers.ts
 *
 * Los handlers se incorporarán aquí cuando exista un contrato de API
 * acordado para el módulo correspondiente.
 */
export const handlers: RequestHandler[] = [
  ...(process.env.MOCK_PURCHASES === "enabled" ? purchasesHandlers : []),
];
