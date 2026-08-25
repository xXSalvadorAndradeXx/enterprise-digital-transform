"use client";

import { ChevronDown } from "lucide-react";

export type CheckoutStep = "contact" | "shipping" | "payment";

const STEP_ORDER: CheckoutStep[] = ["contact", "shipping", "payment"];
const STEP_TITLES: Record<CheckoutStep, string> = {
  contact: "Contacto",
  shipping: "Opciones de envío",
  payment: "Método de pago",
};

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  onStepChange: (step: CheckoutStep) => void;
}

// Solo dibuja las 3 cabeceras (número + título + chevron). El contenido de
// cada paso lo renderiza CheckoutPage por fuera, según currentStep.
export default function CheckoutSteps({ currentStep, onStepChange }: CheckoutStepsProps) {
  return (
    <div className="flex flex-col gap-4">
      {STEP_ORDER.map((step, i) => {
        const isOpen = step === currentStep;
        return (
          <button
            key={step}
            type="button"
            onClick={() => onStepChange(step)}
            aria-expanded={isOpen}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-5 py-4 text-left transition ${
              isOpen ? "border-[#1B21D1]" : "border-gray-200"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B21D1] text-sm font-semibold text-white">
                {i + 1}
              </span>
              <span className="font-medium text-gray-900">{STEP_TITLES[step]}</span>
            </span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
