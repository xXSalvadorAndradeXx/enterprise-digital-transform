/**
 * Inicializa las herramientas que deben ejecutarse al levantar
 * el servidor de Next.js.
 */
export async function register(): Promise<void> {
  const shouldEnableMocks =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.API_MOCKING === "enabled";

  if (!shouldEnableMocks) {
    return;
  }

  const { server } = await import("./mocks/server");

  server.listen({
    onUnhandledRequest: "warn",
  });

  console.info("[MSW] Mock server enabled");
}
