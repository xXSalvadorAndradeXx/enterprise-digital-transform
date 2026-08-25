"use client";

import { useCart } from "@/hooks/cart/useCart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  previewCheckout,
  createCheckout,
  CheckoutError,
} from "@/services/checkout/checkout.service";

import type {
  CheckoutRequest,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  Order,
} from "@/types/checkout/checkout.types";

import type { PaymentData } from "@/components/checkout/CheckoutPayment";

import AccordionStep from "@/components/checkout/AccordionStep";
import type { CheckoutStep } from "@/components/checkout/CheckoutSteps";
import CheckoutContact from "@/components/checkout/CheckoutContact";
import CheckoutShipping from "@/components/checkout/CheckoutShipping";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

const STEP_ORDER: CheckoutStep[] = [
  "contact",
  "shipping",
  "payment",
];

const STEP_TITLES: Record<CheckoutStep, string> = {
  contact: "Contacto",
  shipping: "Opciones de envío",
  payment: "Método de pago",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  const [currentStep, setCurrentStep] =
    useState<CheckoutStep | null>("contact");

  const [preview, setPreview] =
    useState<CheckoutPreviewResponse | null>(null);

  const [deliveryType, setDeliveryType] = useState<
    "HOME_DELIVERY" | "STORE_PICKUP"
  >("HOME_DELIVERY");

  const [completedSteps, setCompletedSteps] =
    useState<Set<CheckoutStep>>(new Set());

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [createdOrder, setCreatedOrder] =
    useState<Order | null>(null);

  const [checkoutError, setCheckoutError] =
    useState<string | null>(null);
    // SOLO PARA PRUEBAS DE LA TASK 907.
// Cambiar a "STOCK_INSUFFICIENT" para probar stock.
// Cambiar a undefined para volver al checkout normal.
  const MOCK_CHECKOUT_ERROR = "STOCK_INSUFFICIENT";

  /*
   * Una sola Idempotency-Key por intento
   * de checkout.
   */
  const [idempotencyKey] = useState(
    () => crypto.randomUUID(),
  );

  const previewRequest: CheckoutPreviewRequest = {
    source: "CART",

    deliveryType,

    delivery:
      deliveryType === "HOME_DELIVERY"
        ? {
            departmentId: "",
            districtId: "",
            city: "",
            addressLine: "",
          }
        : {
            branchId: "",
          },

    paymentMethod: "CARD",
  };

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const response =
          await previewCheckout(previewRequest);

        setPreview(response);
      } catch (error) {
        console.error(
          "Error obteniendo checkout preview:",
          error,
        );
      }
    };

    loadPreview();
  }, [deliveryType]);

  const handleFinalCheckout = async (
    payment: PaymentData,
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const checkoutRequest: CheckoutRequest = {
        source: "CART",

        customerType: "GUEST",

        contact: {
          fullName: "",
          email: "",
          dui: "",
          phone: "",
        },

        deliveryType,

        delivery:
          deliveryType === "HOME_DELIVERY"
            ? {
                departmentId: "",
                districtId: "",
                city: "",
                addressLine: "",
              }
            : {
                branchId: "",
              },

        paymentMethod:
          payment.method === "PAY_AT_STORE"
            ? "PAY_AT_STORE"
            : "CARD",

        saveAddress: false,

        ...(payment.method === "CARD" &&
        payment.card
          ? {
              card: payment.card,
            }
          : {}),
      };

      const response = await createCheckout(
  checkoutRequest,
  idempotencyKey,
  MOCK_CHECKOUT_ERROR,
);

      setCreatedOrder(response);

      /*
       * Guardar el token del invitado temporalmente.
       * Nunca se agrega a la URL ni se imprime en consola.
       */
      if (response.guestOrderAccessToken) {
        sessionStorage.setItem(
          "guestOrderAccessToken",
          response.guestOrderAccessToken,
        );
      }

      /*
       * La orden fue creada correctamente.
       * Ahora se limpia el carrito.
       */
      await clearCart();

      /*
       * Ir a la pantalla de confirmación.
       * El token NO viaja por la URL.
       */
      router.push(
        `/checkout/confirmacion?orderNumber=${encodeURIComponent(
          response.orderNumber,
        )}&customerType=GUEST`,
      );
    } catch (error) {
      /*
       * PRICE_CHANGED
       */
      if (
        error instanceof CheckoutError &&
        error.code === "PRICE_CHANGED"
      ) {
        setCheckoutError(
          "El precio de uno o más productos cambió. Actualizamos los totales. Revisa el resumen e intenta nuevamente.",
        );

        try {
          const updatedPreview =
            await previewCheckout(
              previewRequest,
            );

          setPreview(updatedPreview);
        } catch {
          setCheckoutError(
            "Los precios cambiaron y no se pudieron actualizar. Intenta nuevamente.",
          );
        }

        return;
      }

      /*
       * STOCK_INSUFFICIENT
       */
      if (
        error instanceof CheckoutError &&
        error.code === "STOCK_INSUFFICIENT"
      ) {
        setCheckoutError(
          "No hay stock suficiente para completar la compra. Revisa tu carrito e intenta nuevamente.",
        );

        return;
      }

      /*
       * Cualquier otro error controlado
       */
      if (error instanceof CheckoutError) {
        setCheckoutError(error.message);

        return;
      }

      /*
       * Error inesperado
       */
      setCheckoutError(
        "Ocurrió un error al procesar la compra. Intenta nuevamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStep = (
    step: CheckoutStep,
  ) => {
    setCurrentStep((previous) =>
      previous === step
        ? null
        : step,
    );
  };

  const goToNext = (
    step: CheckoutStep,
  ) => {
    setCompletedSteps((previous) => {
      const next = new Set(previous);

      next.add(step);

      return next;
    });

    const nextIndex =
      STEP_ORDER.indexOf(step) + 1;

    setCurrentStep(
      nextIndex < STEP_ORDER.length
        ? STEP_ORDER[nextIndex]
        : null,
    );
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="grid gap-6 lg:items-start lg:grid-cols-[1fr_340px]">

          <section className="flex flex-col gap-4">

            {checkoutError && (
              <div
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {checkoutError}
              </div>
            )}

            {STEP_ORDER.map(
              (step, index) => (
                <AccordionStep
                  key={step}
                  index={index + 1}
                  title={STEP_TITLES[step]}
                  isOpen={
                    currentStep === step
                  }
                  isComplete={completedSteps.has(
                    step,
                  )}
                  onToggle={() =>
                    toggleStep(step)
                  }
                >
                  {step === "contact" && (
                    <CheckoutContact />
                  )}

                  {step === "shipping" && (
                    <CheckoutShipping
                      deliveryType={
                        deliveryType
                      }
                      onDeliveryTypeChange={
                        setDeliveryType
                      }
                    />
                  )}

                  {step === "payment" && (
                    <CheckoutPayment
                      onContinue={
                        handleFinalCheckout
                      }
                      isSubmitting={
                        isSubmitting
                      }
                    />
                  )}
                </AccordionStep>
              ),
            )}
          </section>

          <CheckoutSummary
            preview={preview}
            onContinue={() =>
              setCurrentStep("payment")
            }
          />

        </div>
      </div>
    </main>
  );
}