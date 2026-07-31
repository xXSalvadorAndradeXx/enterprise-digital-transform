"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: boolean;
  errorMessage?: string;
  helperText?: React.ReactNode;
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      icon,
      error = false,
      errorMessage,
      helperText,
      containerClassName,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const hasError = error || Boolean(errorMessage);

    return (
      <div className={`w-full ${containerClassName ?? ""}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-semibold text-[#2F2F2F]"
          >
            {label}
          </label>
        )}

        {/* Input */}
        <div
          className={`
            relative
            flex
            h-[55px]
            w-full
            items-center
            rounded-lg
            border
            bg-white
            transition-all
            ${
              hasError
                ? "border-[#FF5A5A]"
                : "border-[#B8BDC8] focus-within:border-[#1C21D1] focus-within:ring-2 focus-within:ring-[#1C21D1]/20"
            }
            ${
              disabled
                ? "cursor-not-allowed bg-[#F8F8F8]"
                : ""
            }
          `}
        >
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`
              h-full
              w-full
              rounded-lg
              bg-transparent
              px-5
              text-[16px]
              text-[#4A4A4A]
              outline-none
              placeholder:text-[#878A92]
              ${icon ? "pr-12" : ""}
              ${className ?? ""}
            `}
            {...props}
          />

          {/* Icono */}
          {icon && (
            <span className="absolute right-4 flex items-center text-[#878A92]">
              {icon}
            </span>
          )}

          {/* Error */}
          {hasError && !icon && (
            <CircleAlert
              size={20}
              className="absolute right-4 text-[#FF5A5A]"
            />
          )}
        </div>

        {/* Mensaje de error */}
   {errorMessage && (
  <p
    id={`${inputId}-error`}
    role="alert"
    className="mt-2 flex items-center gap-2 text-sm text-[#FF5A5A]"
  >
    <CircleAlert
      aria-hidden="true"
      size={18}
      strokeWidth={2}
      className="shrink-0"
    />

    <span>{errorMessage}</span>
  </p>
)}

        {/* Helper */}
        {helperText && (
          <div className="mt-3">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;