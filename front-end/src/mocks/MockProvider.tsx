"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface MockProviderProps {
  children: ReactNode;
}

export function MockProvider({
  children,
}: MockProviderProps) {
  const [isReady, setIsReady] =
    useState(
      process.env.NODE_ENV !== "development",
    );

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development"
    ) {
      return;
    }

    const startWorker = async () => {
      const { worker } =
        await import("@/mocks/browser");

      await worker.start({
        onUnhandledRequest: "bypass",
      });

      setIsReady(true);
    };

    void startWorker();
  }, []);

  if (!isReady) {
    return null;
  }

  return children;
}