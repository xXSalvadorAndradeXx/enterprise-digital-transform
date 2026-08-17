"use client";

import { FileText } from "lucide-react";

export interface InvoiceThumbnailProps {
  src: string;
  alt: string;
  fileType: "image" | "pdf";
  onImageOpen?: () => void;
  className?: string;
  width?: number;
  height?: number;
}

export function InvoiceThumbnail({
  src,
  alt,
  fileType,
  onImageOpen,
  className = "",
  width = 84,
  height = 48,
}: InvoiceThumbnailProps) {
  const hasSource = src.trim().length > 0;
  const dimensions = { width, height };

  if (fileType === "pdf") {
    if (!hasSource) {
      return (
        <span
          aria-label={`${alt}: archivo no disponible`}
          className={`inline-flex items-center justify-center rounded text-[#878A92] ${className}`}
          style={dimensions}
        >
          <FileText aria-hidden="true" size={24} strokeWidth={2} />
        </span>
      );
    }

    return (
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ${alt} en una pestaña nueva`}
        className={`inline-flex items-center justify-center gap-1 rounded text-sm font-medium text-[#1C21D1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] ${className}`}
        style={dimensions}
      >
        <FileText aria-hidden="true" size={24} strokeWidth={2} />
        <span>PDF</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Abrir vista de ${alt}`}
      disabled={!hasSource || !onImageOpen}
      onClick={onImageOpen}
      className={`inline-flex items-center justify-center overflow-hidden rounded bg-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] ${className}`}
      style={dimensions}
    >
      {hasSource ? (
        // A native image supports local, blob and remote invoice URLs without changing Next config.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={width} height={height} className="size-full object-contain" />
      ) : (
        <FileText aria-hidden="true" size={24} strokeWidth={2} />
      )}
    </button>
  );
}
