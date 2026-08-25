"use client";

import { useEffect, useState } from "react";

interface MSWProviderProps {
  children: React.ReactNode;
}

export default function MSWProvider({
  children,
}: MSWProviderProps) {
  const [ready, setReady] = useState(
    process.env.NODE_ENV !== "development"
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const startMSW = async () => {
      const { worker } = await import("@/mocks/browser");

      await worker.start({
        onUnhandledRequest: "bypass",
      });

      setReady(true);
    };

    startMSW();
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}