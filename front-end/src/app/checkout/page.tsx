"use client";

import { useEffect, useState } from "react";

import { previewCheckout } from "@/services/checkout/checkout.service";

import type {
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
} from "@/types/checkout/checkout.types";

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
  const [currentStep, setCurrentStep] =
    useState<CheckoutStep | null>("contact");

  const [preview, setPreview] =
    useState<CheckoutPreviewResponse | null>(null);

  const [deliveryType, setDeliveryType] = useState<
    "HOME_DELIVERY" | "STORE_PICKUP"
  >("HOME_DELIVERY");

  const [completedSteps, setCompletedSteps] =
    useState<Set<CheckoutStep>>(new Set());

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
        const response = await previewCheckout(previewRequest);

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

  const toggleStep = (step: CheckoutStep) => {
    setCurrentStep((previous) =>
      previous === step ? null : step,
    );
  };

  const goToNext = (step: CheckoutStep) => {
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
            {STEP_ORDER.map((step, index) => (
              <AccordionStep
                key={step}
                index={index + 1}
                title={STEP_TITLES[step]}
                isOpen={currentStep === step}
                isComplete={completedSteps.has(step)}
                onToggle={() => toggleStep(step)}
              >
                {step === "contact" && (
                  <CheckoutContact />
                )}

                {step === "shipping" && (
                  <CheckoutShipping
                    deliveryType={deliveryType}
                    onDeliveryTypeChange={setDeliveryType}
                  />
                )}

                {step === "payment" && (
                  <CheckoutPayment />
                )}
              </AccordionStep>
            ))}
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