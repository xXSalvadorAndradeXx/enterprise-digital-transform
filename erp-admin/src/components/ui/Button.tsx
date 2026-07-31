import * as React from "react";
import { LoaderCircle } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      loading = false,
      disabled,
      className,
      type = "button",
      "aria-busy": ariaBusy,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const buttonClasses = [
      // Layout
      "inline-flex items-center justify-center",

      // Solo altura (NO ancho)
      "h-[44px]",

      // Padding
      "px-6",

      // Espacio icono-texto
      "gap-2",

      // Bordes
      "rounded-lg",

      // Tipografía
      "font-[var(--font-body)]",
      "text-[16px]",
      "font-medium",

      // Transiciones
      "transition-colors duration-150",

      // Accesibilidad
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-[#1C21D1]",
      "focus-visible:ring-offset-2",

      loading
        ? "cursor-wait bg-[#1C21D1] text-white"
        : disabled
        ? "cursor-not-allowed bg-[#CFE2FF] text-white"
        : "bg-[#1C21D1] text-white hover:bg-[#171BB8] active:bg-[#1519A6]",

      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading ? true : ariaBusy}
        className={buttonClasses}
        {...props}
      >
        {loading && (
          <LoaderCircle
            className="h-4 w-4 shrink-0 animate-spin"
            strokeWidth={2}
          />
        )}

        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;