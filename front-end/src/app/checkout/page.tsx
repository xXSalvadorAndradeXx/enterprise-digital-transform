"use client";

import { useState } from "react";

import AccordionStep from "@/components/checkout/AccordionStep";
import type { CheckoutStep } from "@/components/checkout/CheckoutSteps";
import CheckoutContact from "@/components/checkout/CheckoutContact";
import CheckoutShipping from "@/components/checkout/CheckoutShipping";
import CheckoutPayment from "@/components/checkout/CheckoutPayment";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

const STEP_ORDER: CheckoutStep[] = ["contact", "shipping", "payment"];
const STEP_TITLES: Record<CheckoutStep, string> = {
  contact: "Contacto",
  shipping: "Opciones de envío",
  payment: "Método de pago",
};

export default function CheckoutPage() {
  // null = todos los paneles cerrados (permitido: el usuario puede cerrar
  // el paso que tenga abierto haciendo clic de nuevo sobre su encabezado).
  const [currentStep, setCurrentStep] = useState<CheckoutStep | null>("contact");
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set());

  const toggleStep = (step: CheckoutStep) => {
    setCurrentStep((prev) => (prev === step ? null : step));
  };

  const goToNext = (step: CheckoutStep) => {
    setCompletedSteps((prev) => new Set(prev).add(step));
    const nextIndex = STEP_ORDER.indexOf(step) + 1;
    setCurrentStep(nextIndex < STEP_ORDER.length ? STEP_ORDER[nextIndex] : null);
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1180px] px-5 py-10">
        <div className="grid gap-6 lg:items-start lg:grid-cols-[1fr_340px]">
          <section className="flex flex-col gap-4">
            {STEP_ORDER.map((step, i) => (
              <AccordionStep
                key={step}
                index={i + 1}
                title={STEP_TITLES[step]}
                isOpen={currentStep === step}
                isComplete={completedSteps.has(step)}
                onToggle={() => toggleStep(step)}
              >
                {step === "contact" && <CheckoutContact />}
                {step === "shipping" && <CheckoutShipping />}
                {step === "payment" && <CheckoutPayment />}
              </AccordionStep>
            ))}
          </section>

          <CheckoutSummary
            onContinue={() => {
              if (currentStep === "contact" || currentStep === "shipping") {
                goToNext(currentStep);
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
