import { Bell } from "lucide-react";

interface NotificationBellProps {
  count?: number;
}

export default function NotificationBell({
  count = 0,
}: NotificationBellProps) {
  return (
    <button className="relative">

      <Bell
        size={22}
        className="text-gray-600"
      />

      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-semibold text-black">
          {count}
        </span>
      )}

    </button>
  );
}