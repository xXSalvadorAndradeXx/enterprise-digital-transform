import { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string;
}

export default function Input({
  label,
  required = false,
  error,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xl font-medium text-[#1E1E1E]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        className={`
          w-full
          rounded-md
          border
          px-4
          py-3
          text-black
          outline-none
          transition
          ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-gray-400 focus:border-[#2E37D3]"
          }
          ${className}
        `}
        {...props}
      />

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}