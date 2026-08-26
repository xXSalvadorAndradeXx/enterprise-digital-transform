"use client";

import { useCart } from "@/hooks/cart/useCart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getCheckoutPreview,
  createCheckout,
  CheckoutError,
} from "@/services/checkout/checkout.service";

import type {
  CheckoutRequest,
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
} from "@/types/checkout/checkout.types";

import type { PaymentData } from "@/components/checkout/CheckoutPayment";

import AccordionStep from "@/components/checkout/AccordionStep";
import type { CheckoutStep } from "@/components/checkout/CheckoutSteps";
import CheckoutContact from "@/components/checkout/CheckoutContact";
import type { ContactData } from "@/components/checkout/CheckoutContact";
import CheckoutShipping from "@/components/checkout/CheckoutShipping";
import type { ShippingData } from "@/components/checkout/CheckoutShipping";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { readAccessToken } from "@/lib/auth-session";
import {
  clearBuyNowSelection,
  readBuyNowSelection,
} from "@/lib/buy-now";
import type { BuyNowSelection } from "@/lib/buy-now";

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
  const {
    clearCart,
    subtotal,
    discountTotal,
    total,
  } = useCart();

  const [currentStep, setCurrentStep] =
    useState<CheckoutStep | null>("contact");

  const [preview, setPreview] =
    useState<CheckoutPreviewResponse | null>(null);

  const [deliveryType, setDeliveryType] = useState<
    "HOME_DELIVERY" | "STORE_PICKUP"
  >("HOME_DELIVERY");

  const [contact, setContact] = useState<ContactData>({
    fullName: "",
    email: "",
    dui: "",
    phone: "",
  });

  const [shipping, setShipping] = useState<ShippingData>({
    departmentId: "",
    districtId: "",
    addressLine: "",
    city: "",
    branchId: "",
    saveInfo: false,
  });

  const [completedSteps, setCompletedSteps] =
    useState<Set<CheckoutStep>>(new Set());

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [checkoutError, setCheckoutError] =
    useState<string | null>(null);

  const [buyNowSelection, setBuyNowSelection] =
    useState<BuyNowSelection | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("source") === "buy-now") {
      const selection = readBuyNowSelection();
      setBuyNowSelection(selection);
      if (!selection) {
        setCheckoutError(
          "No encontramos el producto seleccionado. Vuelve al catálogo e intenta nuevamente.",
        );
      }
    }
  }, []);

  /*
   * Una sola Idempotency-Key por intento
   * de checkout.
   */
  const [idempotencyKey] = useState(
    () => crypto.randomUUID(),
  );

  const previewRequest: CheckoutPreviewRequest = {
    source: buyNowSelection ? "BUY_NOW" : "CART",

    ...(buyNowSelection
      ? { items: [buyNowSelection.item] }
      : {}),

    contact,

    deliveryType,

    delivery:
      deliveryType === "HOME_DELIVERY"
        ? {
            departmentId: shipping.departmentId,
            districtId: shipping.districtId,
            city: shipping.city,
            addressLine: shipping.addressLine,
          }
        : {
            branchId: shipping.branchId,
          },

    paymentMethod: "CARD",
  };

  const buyNowSubtotal = buyNowSelection
    ? buyNowSelection.originalUnitPrice * buyNowSelection.item.quantity
    : 0;
  const buyNowTotal = buyNowSelection
    ? buyNowSelection.unitPrice * buyNowSelection.item.quantity
    : 0;
  const cartSummary: CheckoutPreviewResponse = {
    subtotal: (buyNowSelection ? buyNowSubtotal : subtotal).toFixed(2),
    discountTotal: (buyNowSelection
      ? Math.max(0, buyNowSubtotal - buyNowTotal)
      : discountTotal
    ).toFixed(2),
    shippingTotal: "0.00",
    total: (buyNowSelection ? buyNowTotal : total).toFixed(2),
    freeShippingApplied: false,
  };

  useEffect(() => {
    const validContact = Boolean(
      contact.fullName.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) &&
      /^\d{8}$/.test(contact.phone),
    );
    const validDelivery = deliveryType === "HOME_DELIVERY"
      ? Boolean(shipping.departmentId && shipping.districtId && shipping.city.trim() && shipping.addressLine.trim())
      : Boolean(shipping.branchId);

    if (!validContact || !validDelivery) {
      setPreview(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void getCheckoutPreview(previewRequest).then(
        (response) => {
          setPreview(response);
          setCheckoutError(null);
        },
        (error: unknown) => {
          setCheckoutError(error instanceof Error ? error.message : "No se pudo actualizar el resumen del pedido.");
        },
      );
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [buyNowSelection, contact, deliveryType, shipping]);

  const handleFinalCheckout = async (
    payment: PaymentData,
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const isAuthenticated = Boolean(readAccessToken());
      const customerType = isAuthenticated
        ? ("REGISTERED" as const)
        : ("GUEST" as const);
      const paymentMethod = payment.method === "PAY_AT_STORE"
        ? ("PAY_AT_STORE" as const)
        : ("CARD" as const);
      const checkoutData = {
        customerType,
        contact,
        deliveryType,
        delivery:
          deliveryType === "HOME_DELIVERY"
            ? {
                departmentId: shipping.departmentId,
                districtId: shipping.districtId,
                city: shipping.city,
                addressLine: shipping.addressLine,
              }
            : {
                branchId: shipping.branchId,
              },
        paymentMethod,
        saveAddress: shipping.saveInfo,
        ...(payment.method === "CARD" &&
        payment.card
          ? {
              card: payment.card,
            }
          : {}),
      };
      const checkoutRequest: CheckoutRequest = buyNowSelection
        ? {
            ...checkoutData,
            source: "BUY_NOW",
            items: [buyNowSelection.item],
          }
        : {
            ...checkoutData,
            source: "CART",
          };

      const response = await createCheckout(
        checkoutRequest,
        idempotencyKey,
      );

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
      if (buyNowSelection) {
        clearBuyNowSelection();
      } else {
        await clearCart();
      }

      /*
       * Ir a la pantalla de confirmación.
       * El token NO viaja por la URL.
       */
      router.push(
        `/checkout/confirmacion?orderNumber=${encodeURIComponent(
          response.orderNumber,
        )}&customerType=${isAuthenticated ? "AUTHENTICATED" : "GUEST"}`,
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
            await getCheckoutPreview(
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
                    <CheckoutContact onDataChange={setContact} />
                  )}

                  {step === "shipping" && (
                    <CheckoutShipping
                      deliveryType={
                        deliveryType
                      }
                      onDeliveryTypeChange={
                        setDeliveryType
                      }
                      onDataChange={setShipping}
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
            preview={preview ?? cartSummary}
            onContinue={() =>
              setCurrentStep("payment")
            }
          />

        </div>
      </div>
    </main>
  );
}
