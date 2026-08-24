import { z } from "zod";

import {
  ADMIN_CUSTOMER_SORT_BY_VALUES,
  SORT_ORDER_VALUES,
} from "./customers.types";

const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/;

const ISO_UTC_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

const DECIMAL_WITH_TWO_PLACES_PATTERN =
  /^\d+\.\d{2}$/;

function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const timestamp =
    Date.parse(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(timestamp) &&
    new Date(timestamp)
      .toISOString()
      .slice(0, 10) === value
  );
}

function isIsoUtcDateTime(value: string): boolean {
  return (
    ISO_UTC_DATE_TIME_PATTERN.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export const adminCustomerSortBySchema =
  z.enum(ADMIN_CUSTOMER_SORT_BY_VALUES);

export const sortOrderSchema =
  z.enum(SORT_ORDER_VALUES);

export const isoDateSchema =
  z.string().refine(isIsoDate, {
    message: "Debe ser una fecha ISO valida.",
  });

export const isoUtcDateTimeSchema =
  z.string().refine(isIsoUtcDateTime, {
    message: "Debe ser una fecha y hora ISO UTC valida.",
  });

export const adminCustomerListItemSchema =
  z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    lastOrderAt: isoUtcDateTimeSchema,
    totalOrders: z.number().int().min(0),
    totalSpent: z
      .string()
      .regex(
        DECIMAL_WITH_TWO_PLACES_PATTERN,
        "Debe ser un decimal con dos posiciones.",
      ),
  });

export const pageMetaSchema =
  z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  });

export const adminCustomersQuerySchema =
  z.object({
    search: z.string().optional(),
    lastOrderFrom: isoDateSchema.optional(),
    lastOrderTo: isoDateSchema.optional(),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .optional(),
    sortBy: adminCustomerSortBySchema.optional(),
    order: sortOrderSchema.optional(),
  });

export const adminCustomerListDataSchema =
  z.object({
    items: z.array(adminCustomerListItemSchema),
    meta: pageMetaSchema,
  });

export const adminCustomerListResponseSchema =
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: adminCustomerListDataSchema,
    timestamp: isoUtcDateTimeSchema,
  });
