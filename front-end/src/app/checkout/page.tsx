"use client";

import { useCart } from "@/hooks/cart/useCart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  previewCheckout,
  createCheckout,
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
      console.error(
        "Error creando checkout:",
        error,
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