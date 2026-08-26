export type PublicCategory = {
  id: number;
  name: string;
};

export async function getPublicCategories(signal?: AbortSignal) {
  const response = await fetch(
    "/api/public/categories",
    { signal },
  );

  if (!response.ok) {
    throw new Error("CATEGORY_SERVER_ERROR");
  }

  const payload: unknown = await response.json();
  const raw =
    typeof payload === "object" && payload && "data" in payload
      ? (payload as { data?: unknown }).data
      : payload;

  if (!Array.isArray(raw)) {
    throw new Error("CATEGORY_RESPONSE_ERROR");
  }

  return raw.flatMap((item): PublicCategory[] => {
    if (!item || typeof item !== "object") return [];

    const value = item as Record<string, unknown>;
    const id = Number(value.id);
    const name = String(value.name ?? value.nombre ?? "").trim();

    return Number.isFinite(id) && name ? [{ id, name }] : [];
  });
}
