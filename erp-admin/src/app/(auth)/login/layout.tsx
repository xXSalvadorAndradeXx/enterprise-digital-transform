import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getAuthSession } from "@/lib/session";

interface LoginLayoutProps {
  children: ReactNode;
}

export default async function LoginLayout({ children }: LoginLayoutProps) {
  const session = await getAuthSession();

  if (session) {
    redirect("/dashboard");
  }

  return children;
}
