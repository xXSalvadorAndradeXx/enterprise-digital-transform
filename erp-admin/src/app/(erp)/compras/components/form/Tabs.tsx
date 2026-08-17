"use client";

import { type KeyboardEvent, useRef } from "react";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onValueChange,
  ariaLabel = "Opciones",
  className = "",
}: TabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectAndFocus = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    onValueChange(item.value);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    const enabledIndexes = items
      .map((item, index) => (item.disabled ? null : index))
      .filter((index): index is number => index !== null);

    if (enabledIndexes.length === 0) return;

    const position = enabledIndexes.indexOf(currentIndex);
    let targetIndex: number | undefined;

    if (event.key === "ArrowRight") {
      targetIndex = enabledIndexes[(position + 1) % enabledIndexes.length];
    } else if (event.key === "ArrowLeft") {
      targetIndex =
        enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === "Home") {
      targetIndex = enabledIndexes[0];
    } else if (event.key === "End") {
      targetIndex = enabledIndexes[enabledIndexes.length - 1];
    }

    if (targetIndex === undefined) return;
    event.preventDefault();
    selectAndFocus(targetIndex);
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`grid w-full grid-flow-col auto-cols-fr gap-2 ${className}`}
    >
      {items.map((item, index) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className="min-h-11 min-w-0 rounded-[2px] border border-[#B8CBEA] bg-[#F5F7FA] px-3 py-2 text-sm font-semibold text-[#202124] disabled:cursor-not-allowed disabled:opacity-50 aria-selected:bg-[#E7F0FF] focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1C21D1]"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
