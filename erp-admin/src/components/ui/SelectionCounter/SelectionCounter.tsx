import type { SelectionCounterProps } from "./SelectionCounter.types";

export function SelectionCounter({
  count,
}: SelectionCounterProps) {
  let text = "Seleccionar";

  if (count === 1) {
    text = "1 Seleccionado";
  } else if (count > 1) {
    text = `${count} Seleccionados`;
  }

  return (
    <span className="text-sm font-medium text-gray-700">
      {text}
    </span>
  );
}