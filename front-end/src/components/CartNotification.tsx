"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type CartNotificationType = "success" | "error" | "info";

type CartNotificationProps = {
  type: CartNotificationType;
  message: string;
  onClose?: () => void;
};

const notificationStyles = {
  success: {
    container: "border-emerald-100 bg-emerald-50 text-emerald-800",
    icon: "text-emerald-600",
    Icon: CheckCircle2,
  },
  error: {
    container: "border-red-100 bg-red-50 text-red-700",
    icon: "text-red-600",
    Icon: AlertCircle,
  },
  info: {
    container: "border-[#D9E2EC] bg-[#EAF3FF] text-[#003791]",
    icon: "text-[#005BFF]",
    Icon: Info,
  },
};

export default function CartNotification({
  type,
  message,
  onClose,
}: CartNotificationProps) {
  const styles = notificationStyles[type];
  const Icon = styles.Icon;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_12px_30px_rgba(17,17,17,0.06)] ${styles.container}`}
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 leading-6">{message}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-current/70 transition hover:bg-white/60 hover:text-current"
          aria-label="Cerrar notificacion"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
