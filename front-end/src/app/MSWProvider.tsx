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
      const { startMockWorker } = await import("@/mocks/browser");

      await startMockWorker();

      setReady(true);
    };

    startMSW();
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
