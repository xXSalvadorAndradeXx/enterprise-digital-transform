"use client";

import { RotateCw } from "lucide-react";
import { ErrorStateProps } from "./ErrorState.types";

const ErrorState = ({
  image,
  title,
  description,
  buttonText = "Reintentar",
  onRetry,
  className = "",
}: ErrorStateProps) => {
  return (
    <div
      className={`
        flex
        flex-col
        items-center
        justify-center
        py-10
        px-6
        text-center
        ${className}
      `}
    >
      {/* Imagen */}
      <div
        className="
          mb-8
          flex
          items-center
          justify-center
        "
      >
        <div className="w-[120px] h-[120px] flex items-center justify-center">
          {image}
        </div>
      </div>

      {/* Título */}
      <h2
        className="
          text-[22px]
          font-bold
          leading-[32px]
          text-[#111827]
        "
      >
        {title}
      </h2>

      {/* Descripción */}
      <p
        className="
          mt-2
          max-w-[430px]
          text-[16px]
          leading-[26px]
          text-[#4B5563]
        "
      >
        {description}
      </p>

      {/* Botón */}
      {buttonText && (
        <button
          type="button"
          onClick={onRetry}
          className="
            mt-6
            h-[42px]
            w-[155px]
            rounded-[4px]
            bg-[#FF4D3A]
            text-[14px]
            font-semibold
            text-white
            transition-all
            hover:bg-[#F03D2A]
            flex
            items-center
            justify-center
            gap-2
            shadow-sm
          "
        >
          <RotateCw
            size={16}
            strokeWidth={2}
          />

          {buttonText}
        </button>
      )}
    </div>
  );
};

export default ErrorState;