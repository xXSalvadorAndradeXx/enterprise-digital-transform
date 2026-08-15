"use client";

import {
  KeyboardEvent,
  useState,
} from "react";
import { X } from "lucide-react";

interface ProductTagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

export function ProductTagsInput({
  value,
  onChange,
  error,
}: ProductTagsInputProps) {
  const [input, setInput] = useState("");

  const addTag = (): void => {
    const tag = input.trim();

    if (!tag) return;

    if (value.includes(tag)) {
      setInput("");
      return;
    }

    if (value.length >= 20) {
      return;
    }

    onChange([...value, tag]);
    setInput("");
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (
      event.key === "Enter" ||
      event.key === ","
    ) {
      event.preventDefault();
      addTag();
    }
  };

  const removeTag = (
    tagToRemove: string,
  ): void => {
    onChange(
      value.filter(
        (tag) => tag !== tagToRemove,
      ),
    );
  };

  return (
    <div>
      <label
        htmlFor="product-tags"
        className="mb-2 block text-sm font-medium text-gray-900"
      >
        Etiquetas
      </label>

            <div
        className={`rounded-md border bg-white transition-colors ${
            error
            ? "border-red-400"
            : "border-gray-300 focus-within:border-[#1C21D1] focus-within:ring-1 focus-within:ring-[#1C21D1]"
        }`}
        >
        <input
        id="product-tags"
        value={input}
        onChange={(event) =>
            setInput(event.target.value)
        }
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder="Agregar Etiqueta aquí..."
        className="h-11 w-full border-b border-gray-300  px-3 text-sm leading-5 text-gray-800 outline-none placeholder:text-gray-400"


        />

        <div className="flex min-h-14 flex-wrap items-center gap-2 p-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex min-h-8 items-center gap-1 rounded-md bg-[#F2F5FC] px-3 text-xs text-gray-600"
            >
              <span className="max-w-40 truncate">
                {tag}
              </span>

              <button
                type="button"
                onClick={() =>
                  removeTag(tag)
                }
                aria-label={`Eliminar etiqueta ${tag}`}
                className="rounded focus:outline-none focus:ring-2 focus:ring-[#1C21D1]"
              >
                <X
                  size={13}
                  aria-hidden="true"
                />
              </button>
            </span>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-1 text-xs text-red-500"
        >
          {error}
        </p>
      )}
    </div>
  );
}