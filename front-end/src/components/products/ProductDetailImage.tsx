"use client";

import Image from "next/image";
import { useState } from "react";

type ProductDetailImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export default function ProductDetailImage({
  src,
  alt,
  priority = false,
}: ProductDetailImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const imageUrl = src.trim();
  const shouldShowImage = imageUrl.length > 0 && failedImageUrl !== imageUrl;

  if (!shouldShowImage) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EAF3FF] to-[#F4F7FB] px-6 text-center">
        <span className="rounded-full border border-[#D9E2EC] bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
          Sin imagen
        </span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 1024px) 100vw, 50vw"
      className="object-cover"
      onError={() => setFailedImageUrl(imageUrl)}
    />
  );
}