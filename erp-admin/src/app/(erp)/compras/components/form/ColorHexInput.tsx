"use client";

type ColorHexInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function ColorHexInput({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Color hexadecimal",
  className = "",
}: ColorHexInputProps) {
  const pickerValue = HEX_COLOR.test(value.trim())
    ? value.trim()
    : "#000000";

  return (
    <div
      className={`flex h-8 min-w-0 items-center gap-1.5 rounded border border-[#878A92] bg-white px-1.5 focus-within:border-[#1C21D1] focus-within:ring-1 focus-within:ring-[#1C21D1] ${className}`}
    >
      <input
        type="color"
        value={pickerValue}
        disabled={disabled}
        aria-label={`Seleccionar ${ariaLabel.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="size-5 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed"
      />
      <input
        type="text"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder="#000000"
        maxLength={7}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-xs text-[#202124] outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
