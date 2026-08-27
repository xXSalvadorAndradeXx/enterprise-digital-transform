import {
  Headphones,
  RefreshCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";

const authBenefits = [
  [Truck, "Envíos gratis en compras +$50"],
  [RefreshCcw, "Devoluciones hasta 30 días"],
  [ShieldCheck, "Pago 100% seguro"],
  [Headphones, "Atención personal"],
] as const;

export function AuthBenefitsBar() {
  return (
    <div className="bg-[#f2f5fb]">
      <ul className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-x-3 gap-y-3 px-4 py-3 sm:grid-cols-4 sm:gap-y-0 sm:px-6 lg:px-8">
        {authBenefits.map(([Icon, label]) => (
          <li
            key={label}
            className="flex min-w-0 items-center justify-center gap-2 text-center text-[10px] font-semibold text-[#111111] lg:gap-3 lg:text-xs"
          >
            <Icon
              className="h-4 w-4 shrink-0 lg:h-[18px] lg:w-[18px]"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <span>{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
