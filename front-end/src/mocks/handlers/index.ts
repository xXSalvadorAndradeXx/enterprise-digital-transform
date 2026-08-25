import type { RequestHandler } from "msw";
import { checkoutHandlers } from "./checkout.handlers";

export const handlers: RequestHandler[] = [
  ...checkoutHandlers,
];