import type { ReactNode } from "react";
import { CustomerPortal } from "@/components/portal/CustomerPortal";

export default function CuentaLayout({ children }: { children: ReactNode }) {
  return <CustomerPortal>{children}</CustomerPortal>;
}
