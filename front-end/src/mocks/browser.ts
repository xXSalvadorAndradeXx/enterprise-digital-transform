import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

type GlobalWithMsw = typeof globalThis & {
  __wodenMswStartPromise?: Promise<void>;
};

export function startMockWorker(): Promise<void> {
  const globalWithMsw = globalThis as GlobalWithMsw;

  if (!globalWithMsw.__wodenMswStartPromise) {
    globalWithMsw.__wodenMswStartPromise = worker
      .start({ onUnhandledRequest: "bypass" })
      .then(() => undefined);
  }

  return globalWithMsw.__wodenMswStartPromise;
}
