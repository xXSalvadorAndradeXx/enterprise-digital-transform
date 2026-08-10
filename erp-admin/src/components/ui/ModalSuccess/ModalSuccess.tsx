"use client";

import { Check } from "lucide-react";
import { Modal } from "../Modal";

interface ModalSuccessProps {
  isOpen: boolean;
  message: string;
  buttonText?: string;
  onAccept: () => void;
}

export default function ModalSuccess({
  isOpen,
  message,
  buttonText = "Aceptar",
  onAccept,
}: ModalSuccessProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onAccept}
      title=""
      size="md"
      headerDivider={false}
    >
      <div className="flex flex-col items-center justify-center py-6">

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
          <Check size={42} className="text-white" />
        </div>

        <h3 className="mb-8 text-center text-3xl font-semibold text-green-600">
          {message}
        </h3>

        <button
          onClick={onAccept}
          className="rounded-lg bg-green-500 px-10 py-3 font-medium text-white transition hover:bg-green-600"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
