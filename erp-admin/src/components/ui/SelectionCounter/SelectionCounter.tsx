import type { SelectionCounterProps } from "./SelectionCounter.types";

export function SelectionCounter({
  count,
  className = "",
}: SelectionCounterProps) {
  const label = count === 1 ? "Seleccionado" : "Seleccionados";

  return (
    <span
      aria-live="polite"
      className={`text-sm font-medium text-gray-700 ${className}`}
    >
      {count} {label}
    </span>
  );
}