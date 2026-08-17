"use client";

import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  infoMessage?: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  infoMessage,
  actionLabel,
  actionIcon,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center bg-transparent text-center text-black ${className}`}>
      {icon && (
        <div
          aria-hidden="true"
          className="mb-6 flex h-[110px] w-[126px] items-center justify-center text-[#1C21D1] [&>svg]:size-full"
        >
          {icon}
        </div>
      )}

      <h2 className="font-[var(--font-title)] text-[32px] leading-10 font-bold">{title}</h2>

      {description && (
        <p className="mt-2 text-center text-2xl leading-8 text-black">{description}</p>
      )}

      {infoMessage && (
        <div className="mt-10 flex min-h-[39px] w-full max-w-[510px] items-center justify-center gap-3 rounded-[15px] bg-[#F2F5FC] px-[14px] py-2 text-center text-base text-[#4A4A4A]">
          <CircleAlert
            aria-hidden="true"
            className="shrink-0 text-[#1C21D1]"
            size={20}
            strokeWidth={2}
          />
          <span>{infoMessage}</span>
        </div>
      )}

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-[45px] w-[260px] shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-[4px] bg-[#1C21D1] px-4 text-xl font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C21D1] [&_svg]:size-6"
        >
          {actionIcon && <span aria-hidden="true">{actionIcon}</span>}
          {actionLabel}
        </button>
      )}
    </div>
  );
}
