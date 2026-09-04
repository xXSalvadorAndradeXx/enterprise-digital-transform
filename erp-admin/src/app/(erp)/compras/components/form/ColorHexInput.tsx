"use client";

type ColorHexInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const COLORS = [
  ["Negro", "#000000"], ["Blanco", "#FFFFFF"],
  ["Gris", "#808080"], ["Rojo", "#FF0000"],
  ["Azul", "#0000FF"], ["Azul marino", "#000080"],
  ["Verde", "#008000"], ["Amarillo", "#FFFF00"],
  ["Naranja", "#FFA500"], ["Rosado", "#FFC0CB"],
  ["Fucsia", "#FF00FF"], ["Morado", "#800080"],
  ["Lila", "#C8A2C8"], ["Celeste", "#87CEEB"],
  ["Turquesa", "#40E0D0"], ["Café", "#A52A2A"],
  ["Beige", "#F5F5DC"], ["Crema", "#FFFDD0"],
  ["Vino", "#800020"], ["Dorado", "#FFD700"],
  ["Plata", "#C0C0C0"], ["Oro rosa", "#B76E79"],
  ["Bronce", "#CD7F32"], ["Cobre", "#B87333"],
] as const;

export function ColorHexInput({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Color",
  className = "",
}: ColorHexInputProps) {
  const pickerValue = HEX_COLOR.test(value.trim())
    ? value.trim()
    : "#000000";

  return (
    <div
      className={`flex h-8 min-w-0 items-center gap-1.5 rounded border border-[#878A92] bg-white px-1.5 focus-within:border-[#1C21D1] focus-within:ring-1 focus-within:ring-[#1C21D1] ${className}`}
    >
      <span aria-hidden="true" className="size-4 shrink-0 rounded-sm border border-black/15" style={{ backgroundColor: pickerValue }} />
      <select
        value={value.trim().toUpperCase()}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-xs text-[#202124] outline-none disabled:cursor-not-allowed"
      >
        <option value="" disabled>Seleccionar</option>
        {value.trim() && !COLORS.some(([, hex]) => hex === value.trim().toUpperCase()) && (
          <option value={value.trim().toUpperCase()}>Color guardado</option>
        )}
        {COLORS.map(([name, hex]) => <option key={hex} value={hex}>{name}</option>)}
      </select>
    </div>
  );
}
