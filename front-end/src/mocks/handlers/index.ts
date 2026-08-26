import type {
  RequestHandler,
} from "msw";

import {
  cartHandlers,
} from "./cart.handlers";


/**
 * Handlers temporales utilizados para
 * desarrollo y pruebas mientras Backend
 * no está disponible.
 */
export const handlers: RequestHandler[] = [
  ...cartHandlers,
];
