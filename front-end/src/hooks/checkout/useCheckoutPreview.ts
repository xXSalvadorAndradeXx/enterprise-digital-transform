"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import { getCheckoutPreview } from "@/services/checkout/checkout.service";

import type {
  CheckoutErrorResponse,
  CheckoutPreviewData,
  CheckoutPreviewRequest,
} from "@/types/checkout/checkout.types";

export type CheckoutPreviewErrorType =
  | "INVALID_DELIVERY"
  | "INVALID_PAYMENT_COMBINATION"
  | "PRICE_CHANGED"
  | "STOCK_INSUFFICIENT"
  | "UNKNOWN";

export interface CheckoutPreviewError {
  type: CheckoutPreviewErrorType;
  message: string;
  details?: Record<string, unknown>;
}

export interface UseCheckoutPreviewValue {
  preview: CheckoutPreviewData | null;
  isLoading: boolean;
  error: CheckoutPreviewError | null;

  requestPreview: (
    request: CheckoutPreviewRequest,
  ) => Promise<CheckoutPreviewData | null>;

  retryPreview: () => Promise<CheckoutPreviewData | null>;

  resetPreview: () => void;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function extractCheckoutError(
  error: unknown,
): CheckoutErrorResponse | null {
  if (!isRecord(error)) {
    return null;
  }

  const response = error.response;

  if (!isRecord(response)) {
    return null;
  }

  const code =
    typeof response.code === "string"
      ? response.code
      : null;

  const message =
    typeof response.message === "string"
      ? response.message
      : null;

  if (!code || !message) {
    return null;
  }

  return {
    success: false,

    statusCode:
      typeof response.statusCode === "number"
        ? response.statusCode
        : 0,

    code,

    message,

    error:
      typeof response.error === "string"
        ? response.error
        : "Error",

    details:
      isRecord(response.details)
        ? response.details
        : undefined,

    timestamp:
      typeof response.timestamp === "string"
        ? response.timestamp
        : "",

    path:
      typeof response.path === "string"
        ? response.path
        : "",
  };
}

function isCheckoutPreviewData(
  value: unknown,
): value is CheckoutPreviewData {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.subtotal === "string" &&
    typeof value.discountTotal === "string" &&
    typeof value.shippingTotal === "string" &&
    typeof value.total === "string" &&
    typeof value.freeShippingApplied === "boolean"
  );
}

function getRecalculatedPreview(
  details?: Record<string, unknown>,
): CheckoutPreviewData | null {
  if (!details) {
    return null;
  }

  /*
   * Permite ambas formas mientras Backend
   * mantenga los valores recalculados en details:
   *
   * details: {
   *   subtotal,
   *   discountTotal,
   *   shippingTotal,
   *   total,
   *   freeShippingApplied
   * }
   *
   * o:
   *
   * details: {
   *   recalculated: { ... }
   * }
   */
  if (isCheckoutPreviewData(details)) {
    return details;
  }

  if (
    "recalculated" in details &&
    isCheckoutPreviewData(
      details.recalculated,
    )
  ) {
    return details.recalculated;
  }

  return null;
}

function normalizeCheckoutError(
  error: unknown,
): CheckoutPreviewError {
  const payload =
    extractCheckoutError(error);

  if (!payload) {
    return {
      type: "UNKNOWN",

      message:
        error instanceof Error
          ? error.message
          : "No se pudo obtener la vista previa del pedido.",
    };
  }

  switch (payload.code) {
    case "INVALID_DELIVERY":
      return {
        type: "INVALID_DELIVERY",
        message: payload.message,
        details: payload.details,
      };

    case "INVALID_PAYMENT_COMBINATION":
      return {
        type:
          "INVALID_PAYMENT_COMBINATION",
        message: payload.message,
        details: payload.details,
      };

    case "PRICE_CHANGED":
      return {
        type: "PRICE_CHANGED",
        message: payload.message,
        details: payload.details,
      };

    case "STOCK_INSUFFICIENT":
      return {
        type: "STOCK_INSUFFICIENT",
        message: payload.message,
        details: payload.details,
      };

    default:
      return {
        type: "UNKNOWN",
        message: payload.message,
        details: payload.details,
      };
  }
}

export function useCheckoutPreview(): UseCheckoutPreviewValue {
  const [
    preview,
    setPreview,
  ] =
    useState<CheckoutPreviewData | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<CheckoutPreviewError | null>(
      null,
    );

  const lastRequestRef =
    useRef<CheckoutPreviewRequest | null>(
      null,
    );

  const requestPreview =
    useCallback(
      async (
        request: CheckoutPreviewRequest,
      ): Promise<CheckoutPreviewData | null> => {
        lastRequestRef.current =
          request;

        setIsLoading(true);
        setError(null);

        try {
          const result =
            await getCheckoutPreview(
              request,
            );

          /*
           * Los valores se conservan exactamente
           * como los devuelve Backend.
           */
          setPreview(result);

          return result;
        } catch (requestError) {
          const payload =
            extractCheckoutError(
              requestError,
            );

          const normalizedError =
            normalizeCheckoutError(
              requestError,
            );

          /*
           * PRICE_CHANGED puede devolver
           * los valores comerciales recalculados
           * dentro de details.
           */
          if (
            payload?.code ===
            "PRICE_CHANGED"
          ) {
            const recalculatedPreview =
              getRecalculatedPreview(
                payload.details,
              );

            setPreview(
              recalculatedPreview,
            );
          } else {
            /*
             * Para otros conflictos el preview
             * anterior deja de considerarse válido.
             */
            setPreview(null);
          }

          setError(
            normalizedError,
          );

          return null;
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  const retryPreview =
    useCallback(async () => {
      const lastRequest =
        lastRequestRef.current;

      if (!lastRequest) {
        return null;
      }

      return requestPreview(
        lastRequest,
      );
    }, [
      requestPreview,
    ]);

  const resetPreview =
    useCallback(() => {
      setPreview(null);
      setError(null);
      setIsLoading(false);

      lastRequestRef.current =
        null;
    }, []);

  return {
    preview,
    isLoading,
    error,
    requestPreview,
    retryPreview,
    resetPreview,
  };
}

export default useCheckoutPreview;