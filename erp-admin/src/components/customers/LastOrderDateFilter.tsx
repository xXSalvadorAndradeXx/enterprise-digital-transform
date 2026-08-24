"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  X,
} from "lucide-react";

interface LastOrderDateFilterProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onClear: () => void;
}

function formatDateLabel(
  value: string,
): string {
  const [
    year,
    month,
    day,
  ] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getButtonLabel(
  from: string,
  to: string,
): string {
  if (from && to) {
    return `${formatDateLabel(
      from,
    )} - ${formatDateLabel(to)}`;
  }

  if (from) {
    return `Desde ${formatDateLabel(
      from,
    )}`;
  }

  if (to) {
    return `Hasta ${formatDateLabel(
      to,
    )}`;
  }

  return "Ultima compra";
}

export function LastOrderDateFilter({
  from,
  to,
  onFromChange,
  onToChange,
  onClear,
}: LastOrderDateFilterProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);
  const containerRef =
    useRef<HTMLDivElement>(
      null,
    );
  const panelId =
    useId();
  const hasValue =
    Boolean(from || to);

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
  }, [
    isOpen,
  ]);

  const clearFilter = (): void => {
    onClear();
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 sm:w-auto sm:min-w-[240px]"
    >
      <button
        type="button"
        aria-label="Filtrar por ultima compra"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() =>
          setIsOpen(
            (current) =>
              !current,
          )
        }
        className="flex h-10 w-full items-center justify-between gap-3 rounded-md bg-[#1C21D1] px-3 text-sm font-medium text-white transition-colors hover:bg-[#171BB8]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays
            size={16}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />

          <span className="truncate">
            {getButtonLabel(
              from,
              to,
            )}
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
          id={panelId}
          className="absolute left-0 top-full z-50 mt-2 w-full rounded-md border border-gray-200 bg-white p-3 shadow-lg sm:min-w-[280px]"
        >
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-medium text-gray-700">
              <span>Desde</span>
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(event) =>
                  onFromChange(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#1C21D1] focus:outline-none focus:ring-2 focus:ring-[#1C21D1]/20"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-gray-700">
              <span>Hasta</span>
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(event) =>
                  onToChange(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-[#1C21D1] focus:outline-none focus:ring-2 focus:ring-[#1C21D1]/20"
              />
            </label>

            <div className="flex justify-end border-t border-gray-100 pt-3">
              <button
                type="button"
                disabled={!hasValue}
                onClick={clearFilter}
                className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#F2F5FC] disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                <X
                  size={16}
                  aria-hidden="true"
                />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
