import { Package } from "lucide-react";

interface ProductImageProps {
  src: string | null;
  alt: string;
}

export function ProductImage({
  src,
  alt,
}: ProductImageProps) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-50">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <Package
          size={19}
          className="text-gray-400"
          strokeWidth={1.7}
        />
      )}
    </div>
  );
}