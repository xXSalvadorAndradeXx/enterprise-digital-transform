import { LucideIcon } from "lucide-react";

export type StatusTone = "success" | "neutral" | "danger" | "warning";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "text-[#55B559]",
  neutral: "text-gray-400",
  danger: "text-red-500",
  warning: "text-amber-500",
};

interface StatusDotProps {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
}

/**
 * Generic status indicator: an icon + label in a given tone color.
 * Deliberately domain-agnostic — it doesn't know about "Colaborador" or any
 * specific module. Each module maps its own status values to {label, tone, icon}
 * and passes them in (see types/equipo for the Equipo mapping).
 */
export function StatusDot({ label, tone, icon: Icon }: StatusDotProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${TONE_CLASSES[tone]}`}>
      <Icon size={16} />
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}