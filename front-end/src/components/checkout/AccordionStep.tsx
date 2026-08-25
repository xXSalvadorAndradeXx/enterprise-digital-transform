"use client";

import type { ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

interface AccordionStepProps {
  index: number;
  title: string;
  isOpen: boolean;
  isComplete: boolean;
  onToggle: () => void;
  children: ReactNode;
}

// Acordeón de un solo panel abierto a la vez. El estado "abierto" lo decide
// el padre (CheckoutPage) para poder garantizar que solo una sección esté
// expandida en cualquier momento, tal como en el diseño de Figma: el
// contenido de cada paso se renderiza pegado a su propio encabezado.
export default function AccordionStep({
  index,
  title,
  isOpen,
  isComplete,
  onToggle,
  children,
}: AccordionStepProps) {
  const panelId = `checkout-step-panel-${index}`;
  const headerId = `checkout-step-header-${index}`;

  return (
    <div className="rounded-lg border border-gray-900 bg-white">
      <h3 className="m-0">
        <button
          id={headerId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1B21D1] text-sm font-semibold text-white">
              {isComplete && !isOpen ? <Check className="h-4 w-4" aria-hidden="true" /> : index}
            </span>
            <span className="font-medium text-gray-900">{title}</span>
          </span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        hidden={!isOpen}
        className="border-t border-gray-100 px-5 py-5"
      >
        {children}
      </div>
    </div>
  );
}
