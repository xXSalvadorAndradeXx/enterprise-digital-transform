import { setupServer } from "msw/node";

import { handlers } from "./handlers";

/**
 * Servidor MSW para el runtime Node de Next.js.
 *
 * Intercepta las solicitudes que los Route Handlers realizan
 * hacia el Backend, sin modificar componentes, hooks o services.
 */
export const server = setupServer(...handlers);
