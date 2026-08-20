interface ProductTagsProps {
  tags: string[];
}

export function ProductTags({
  tags,
}: ProductTagsProps) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Sin etiquetas
      </p>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      aria-label="Etiquetas del producto"
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex min-h-9 max-w-[180px] items-center truncate rounded-md bg-[#F2F5FC] px-3 py-2 text-xs text-gray-600"
          title={tag}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
