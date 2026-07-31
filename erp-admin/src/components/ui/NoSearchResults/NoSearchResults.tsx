import { NoSearchResultsProps } from "./NoSearchResults.types";

export default function NoSearchResults({
  image,
  title,
  description,
  buttonText,
  onButtonClick,
}: NoSearchResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {image}

      <h2 className="mt-8 text-[40px] font-semibold text-[#3F3D56]">
        {title}
      </h2>

      <p className="mt-4 max-w-[420px] text-[18px] text-[#666666]">
        {description}
      </p>

      <button
        onClick={onButtonClick}
        className="
          mt-10
          rounded-md
          border
          border-[#2F3CE9]
          bg-white
          px-8
          py-3
          text-sm
          font-medium
          text-[#2F3CE9]
          transition
          hover:bg-[#2F3CE9]
          hover:text-white
        "
      >
        {buttonText}
      </button>
    </div>
  );
}