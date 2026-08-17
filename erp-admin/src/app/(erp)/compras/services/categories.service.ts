export interface PurchaseCategory {
  id: number;
  name: string;
  description: string | null;
}

type BackendCategory = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapData(value: unknown): unknown {
  return isRecord(value) && "data" in value ? value.data : value;
}

function isBackendCategory(value: unknown): value is BackendCategory {
  return (
    isRecord(value) &&
    Number.isInteger(value.id) &&
    Number(value.id) > 0 &&
    typeof value.nombre === "string" &&
    (value.descripcion === null || typeof value.descripcion === "string")
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown): string {
  if (isRecord(body) && typeof body.message === "string") {
    return body.message;
  }

  return "No se pudieron cargar las categorías.";
}

export async function getPurchaseCategories(
  signal?: AbortSignal,
): Promise<PurchaseCategory[]> {
  const response = await fetch("/api/categories", {
    method: "GET",
    cache: "no-store",
    signal,
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body));
  }

  const data = unwrapData(body);

  if (!Array.isArray(data) || !data.every(isBackendCategory)) {
    throw new Error("La respuesta de categorías no tiene el formato esperado.");
  }

  return data.map((category) => ({
    id: category.id,
    name: category.nombre,
    description: category.descripcion,
  }));
}
