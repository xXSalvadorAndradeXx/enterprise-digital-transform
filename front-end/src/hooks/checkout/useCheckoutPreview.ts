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

  /*
   * ApiRequestError guarda la respuesta del Backend
   * dentro de la propiedad "response".
   */
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
      typeof response.statusCode ===
      "number"
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
      typeof response.timestamp ===
      "string"
        ? response.timestamp
        : "",

    path:
      typeof response.path === "string"
        ? response.path
        : "",
  };
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
        message:
          payload.message ||
          "La información de entrega no es válida.",
        details: payload.details,
      };

    case "INVALID_PAYMENT_COMBINATION":
      return {
        type:
          "INVALID_PAYMENT_COMBINATION",

        message:
          payload.message ||
          "El método de pago no es compatible con el tipo de entrega.",

        details: payload.details,
      };

    case "PRICE_CHANGED":
      return {
        type: "PRICE_CHANGED",

        message:
          payload.message ||
          "El precio o descuento cambió. Revisa los valores actualizados.",

        details: payload.details,
      };

    case "STOCK_INSUFFICIENT":
      return {
        type: "STOCK_INSUFFICIENT",

        message:
          payload.message ||
          "El stock disponible cambió. Revisa las cantidades del carrito.",

        details: payload.details,
      };

    default:
      return {
        type: "UNKNOWN",

        message:
          payload.message ||
          "No se pudo obtener la vista previa del pedido.",

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

  /*
   * Conservamos el último request enviado
   * para poder repetirlo de forma segura.
   */
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
           * No recalculamos ninguno de estos valores.
           * Conservamos exactamente lo recibido
           * desde Backend.
           */
          setPreview(result);

          return result;
        } catch (requestError) {
          const normalizedError =
            normalizeCheckoutError(
              requestError,
            );

          /*
           * Un preview anterior deja de ser válido
           * cuando ocurre un conflicto.
           */
          setPreview(null);

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