"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  ChevronDown,
  Folder,
  ListFilter,
} from "lucide-react";

interface ProductFilterOption {
  label: string;
  value: string;
}

interface ProductFilterProps {
  type: "category" | "status";
  placeholder: string;
  value: string;
  options: ProductFilterOption[];
  onChange: (value: string) => void;
}

export function ProductFilter({
  type,
  placeholder,
  value,
  options,
  onChange,
}: ProductFilterProps) {
  const [isOpen, setIsOpen] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );

  const listboxId =
    useId();

  const selectedOption = options.find(
    (option) => option.value === value,
  );

  const Icon =
    type === "category"
      ? Folder
      : ListFilter;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (
      event: PointerEvent,
    ) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(
          event.target,
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen]);

  const selectValue = (
    nextValue: string,
  ): void => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 sm:w-auto sm:min-w-[140px]"
    >
      <button
        type="button"
        aria-label={placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() =>
          setIsOpen(
            (current) =>
              !current,
          )
        }
        className="flex h-10 w-full items-center justify-between gap-3 rounded-md bg-[#1C21D1] px-3 text-sm font-medium text-white"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Icon
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          <span className="truncate">
            {selectedOption?.label ?? placeholder}
          </span>
        </span>

        <ChevronDown
          size={17}
          className={`shrink-0 transition-transform ${
            isOpen
              ? "rotate-180"
              : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={placeholder}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 min-w-0 overflow-y-auto rounded-md border border-gray-200 bg-white p-1 shadow-lg"
        >
          <button
            type="button"
            role="option"
            aria-selected={value === ""}
            onClick={() =>
              selectValue("")
            }
            className={`block w-full rounded px-3 py-2 text-left text-sm text-gray-900 hover:bg-[#F2F5FC] ${
              value === ""
                ? "bg-[#E8F0FE] font-medium"
                : ""
            }`}
          >
            {placeholder}
          </button>

          {options.map(
            (option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={
                  option.value ===
                  value
                }
                onClick={() =>
                  selectValue(
                    option.value,
                  )
                }
                className={`block w-full truncate rounded px-3 py-2 text-left text-sm text-gray-900 hover:bg-[#F2F5FC] ${
                  option.value ===
                  value
                    ? "bg-[#E8F0FE] font-medium"
                    : ""
                }`}
              >
                {option.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
