"use client";

import { EmptyStateProps } from "./EmptyState.types";

const EmptyState = ({
  image,
  title,
  description,
  helperText,
  buttonText,
  onButtonClick,
  className = "",
}: EmptyStateProps) => {
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
        <div className="w-[112px] h-[112px] flex items-center justify-center">
          {image}
        </div>
      </div>

      {/* Título */}
      <h2
        className="
          text-[22px]
          font-bold
          leading-[30px]
          text-[#111827]
        "
      >
        {title}
      </h2>

      {/* Descripción */}
      <p
        className="
          mt-2
          max-w-[520px]
          text-[16px]
          leading-[28px]
          text-[#4B5563]
        "
      >
        {description}
      </p>

      {/* Mensaje informativo */}
      {helperText && (
        <div
          className="
            mt-6
            flex
            items-center
            justify-center
            gap-2
            h-[32px]
            rounded-full
            bg-[#EEF2FF]
            px-4
            text-[12px]
            text-[#6B7280]
          "
        >
          <span
            className="
              flex
              h-[14px]
              w-[14px]
              items-center
              justify-center
              rounded-full
              border
              border-[#6366F1]
              text-[9px]
              font-bold
              text-[#6366F1]
            "
          >
            i
          </span>

          {helperText}
        </div>
      )}

      {/* Botón */}
      {buttonText && (
        <button
          type="button"
          onClick={onButtonClick}
          className="
            mt-5
            h-[40px]
            w-[170px]
            rounded-[4px]
            bg-[#312ECB]
            text-[14px]
            font-semibold
            text-white
            transition-colors
            hover:bg-[#2724B5]
          "
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;