"use client";

import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

export interface FileUploadInputProps {
  id: string;
  label?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function FileUploadInput({
  id,
  label = "Subir factura",
  file,
  onFileChange,
  accept = "image/*,application/pdf",
  disabled = false,
  error,
  className = "",
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = `${id}-error`;
  const isImage = file?.type.startsWith("image/") ?? false;
  const isPdf = file?.type === "application/pdf";
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const removeFile = () => {
    if (disabled) return;
    if (inputRef.current) inputRef.current.value = "";
    onFileChange(null);
  };

  return (
    <div className={`w-full max-w-[190px] ${className}`}>
      <span className="mb-2 block text-sm font-medium text-[#202124]">{label}</span>

      {!file ? (
        <label
          htmlFor={id}
          className={`flex h-16 w-full items-center justify-center rounded-[4px] border border-dashed border-[#878A92] bg-[#F7F7F8] text-[#4A4A4A] transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1C21D1] ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-[#1C21D1] hover:text-[#1C21D1]"
          }`}
        >
          <Upload aria-hidden="true" size={28} strokeWidth={1.8} />
          <span className="sr-only">Seleccionar archivo para {label.toLowerCase()}</span>
        </label>
      ) : (
        <div className="relative w-full overflow-hidden border border-[#D9DAE0] bg-[#F7F7F8] p-2">
          {previewUrl && isImage && (
            <div className="relative h-20 w-full">
              <Image
                src={previewUrl}
                alt={`Vista previa de ${file.name}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 320px"
                className="object-contain"
              />
            </div>
          )}

          {previewUrl && isPdf && (
            <object
              data={previewUrl}
              type="application/pdf"
              aria-label={`Vista previa de ${file.name}`}
              className="h-24 w-full bg-white"
            >
              <p className="p-3 text-sm text-[#4A4A4A]">
                No se pudo mostrar la vista previa de {file.name}.
              </p>
            </object>
          )}

          {!isImage && !isPdf && (
            <p className="truncate p-3 pr-10 text-sm text-[#4A4A4A]">{file.name}</p>
          )}

          <button
            type="button"
            aria-label={`Quitar archivo ${file.name}`}
            disabled={disabled}
            onClick={removeFile}
            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-[#D9DAE0] bg-white text-[#202124] shadow-sm disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1]"
          >
            <X aria-hidden="true" size={18} strokeWidth={2} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => {
          const selectedFile = event.target.files?.[0] ?? null;
          onFileChange(selectedFile);
          event.target.value = "";
        }}
        className="sr-only"
      />

      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
