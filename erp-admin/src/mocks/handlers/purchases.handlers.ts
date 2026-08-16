import { http, HttpResponse } from "msw";

import type { CreateNewProductPurchaseRequest, CreateRestockPurchaseRequest, PurchaseResponse, UpdatePurchaseRequest } from "@/app/(erp)/compras/types/purchases.types";
import { mockPurchaseSuppliers, mockPurchases, mockRestockInventories } from "../data/purchases.mock";

const apiUrl = (process.env.BACKEND_API_URL ?? "http://localhost:3000/api/v1").replace(/\/+$/, "");
const makeId = () => crypto.randomUUID();

function createResponse(input: { type: PurchaseResponse["type"]; supplierId: string; productName: string; purchaseDate: string; invoiceUrl: string; brand?: string; categoryId?: string; gender?: PurchaseResponse["gender"]; variants: Array<{ sku?: string; size: string; color: string; quantity: number; unitCost: number }> }): PurchaseResponse {
  const totalQuantity = input.variants.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = input.variants.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  return {
    id: makeId(), reference: `CP-${String(mockPurchases.length + 1).padStart(4, "0")}`, type: input.type, productName: input.productName, brand: input.brand, categoryId: input.categoryId, gender: input.gender, purchaseDate: input.purchaseDate, totalAmount, totalQuantity, invoiceUrl: input.invoiceUrl, status: "COMPLETED",
    supplier: { id: input.supplierId, name: mockPurchaseSuppliers.find((supplier) => supplier.id === input.supplierId)?.name ?? "Proveedor seleccionado" },
    items: input.variants.map((item, index) => ({ id: makeId(), sku: item.sku ?? `MOCK-${Date.now()}-${index + 1}`, size: item.size, color: item.color.toUpperCase(), quantity: item.quantity, unitCost: item.unitCost, subtotal: item.quantity * item.unitCost })),
    createdBy: { id: "90000000-0000-4000-8000-000000000001", firstName: "Admin", lastName: "ERP" }, createdAt: new Date().toISOString(), deletedAt: null,
  };
}

export const purchasesHandlers = [
  http.get(`${apiUrl}/suppliers`, ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 100));
    const search = (url.searchParams.get("search") ?? "").trim().toLowerCase();
    const filtered = mockPurchaseSuppliers.filter((supplier) =>
      supplier.name.toLowerCase().includes(search),
    );

    return HttpResponse.json<Record<string, unknown>>({
      data: filtered.slice((page - 1) * limit, page * limit),
      meta: {
        total: filtered.length,
        page,
        limit,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
  }),
  http.post(`${apiUrl}/purchases/upload-invoice`, async ({ request }) => {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return HttpResponse.json<Record<string, unknown>>({ message: "La factura es obligatoria." }, { status: 422 });
    if (!["image/png", "image/jpeg", "application/pdf"].includes(file.type)) return HttpResponse.json<Record<string, unknown>>({ message: "Formato de factura no permitido." }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return HttpResponse.json<Record<string, unknown>>({ message: "La factura supera el tamaño máximo de 10 MB." }, { status: 400 });
    return HttpResponse.json<Record<string, unknown>>({ data: { invoiceUrl: `https://mock.erp.local/invoices/${makeId()}-${file.name}`, fileName: file.name, mimeType: file.type, sizeBytes: file.size }, statusCode: 201 }, { status: 201 });
  }),
  http.post(`${apiUrl}/purchases/nuevo-producto`, async ({ request }) => {
    const body = await request.json() as CreateNewProductPurchaseRequest;
    if (!body.invoiceUrl || !body.purchaseDate || !body.brand || body.variants.length === 0) return HttpResponse.json<Record<string, unknown>>({ message: "La compra contiene campos obligatorios incompletos." }, { status: 422 });
    const purchase = createResponse({ type: "NUEVO_PRODUCTO", supplierId: body.supplierId, productName: body.productName, brand: body.brand, categoryId: body.categoryId, gender: body.gender, purchaseDate: body.purchaseDate, invoiceUrl: body.invoiceUrl, variants: body.variants });
    mockPurchases.unshift(purchase);
    return HttpResponse.json<Record<string, unknown>>({ data: purchase, statusCode: 201 }, { status: 201 });
  }),
  http.post(`${apiUrl}/purchases/reabastecimiento`, async ({ request }) => {
    const body = await request.json() as CreateRestockPurchaseRequest;
    const inventory = mockRestockInventories.find((item) => item.inventory.id === body.inventoryId);
    if (!inventory) return HttpResponse.json<Record<string, unknown>>({ message: "Inventario no encontrado." }, { status: 404 });
    if (body.existingVariants.length + body.newVariants.length === 0) return HttpResponse.json<Record<string, unknown>>({ message: "Agrega al menos una variante." }, { status: 422 });
    const existing = body.existingVariants.map((item) => { const detail = inventory.details.find((candidate) => candidate.inventoryDetailId === item.inventoryDetailId); if (!detail) return null; detail.currentStock += item.quantity; detail.currentUnitCost = item.unitCost; return { ...item, sku: detail.sku, size: detail.size, color: detail.color }; });
    if (existing.some((item) => item === null)) return HttpResponse.json<Record<string, unknown>>({ message: "Una variante no pertenece al inventario." }, { status: 409 });
    const newItems = body.newVariants.map((item, index) => ({ ...item, sku: `MOCK-${Date.now()}-${index + 1}` }));
    newItems.forEach((item) => inventory.details.push({ inventoryDetailId: makeId(), sku: item.sku, size: item.size, color: item.color, currentStock: item.quantity, currentUnitCost: item.unitCost }));
    const purchase = createResponse({ type: "REABASTECIMIENTO", supplierId: body.supplierId, productName: inventory.inventory.productName, purchaseDate: body.purchaseDate, invoiceUrl: body.invoiceUrl, variants: [...existing.filter((item): item is NonNullable<typeof item> => item !== null), ...newItems] });
    mockPurchases.unshift(purchase);
    return HttpResponse.json<Record<string, unknown>>({ data: purchase, statusCode: 201 }, { status: 201 });
  }),
  http.get(`${apiUrl}/purchases`, ({ request }) => {
    const url = new URL(request.url); const page = Math.max(1, Number(url.searchParams.get("page") ?? 1)); const limit = Math.max(1, Number(url.searchParams.get("limit") ?? 4)); const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const filtered = mockPurchases.filter((item) => !item.deletedAt && (!search || item.supplier.name.toLowerCase().includes(search) || item.productName.toLowerCase().includes(search) || item.reference.toLowerCase().includes(search)));
    return HttpResponse.json<Record<string, unknown>>({ data: filtered.slice((page - 1) * limit, page * limit), meta: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) } });
  }),
  http.get(`${apiUrl}/inventory`, ({ request }) => { const search = new URL(request.url).searchParams.get("search")?.toLowerCase() ?? ""; const data = mockRestockInventories.filter((item) => !search || item.inventory.productName.toLowerCase().includes(search)).map((item) => ({ id: item.inventory.id, productName: item.inventory.productName, sku: item.details[0]?.sku ?? "" })); return HttpResponse.json<Record<string, unknown>>({ data, statusCode: 200 }); }),
  http.get(`${apiUrl}/purchases/inventory/:inventoryId/preview-restock`, ({ params }) => { const item = mockRestockInventories.find((candidate) => candidate.inventory.id === params.inventoryId); return item ? HttpResponse.json<Record<string, unknown>>({ data: item, statusCode: 200 }) : HttpResponse.json<Record<string, unknown>>({ message: "Inventario no encontrado." }, { status: 404 }); }),
  http.get(`${apiUrl}/purchases/:id`, ({ params }) => {
    const purchase = mockPurchases.find(
      (candidate) => candidate.id === params.id && !candidate.deletedAt,
    );
    return purchase
      ? HttpResponse.json<Record<string, unknown>>({ data: purchase, statusCode: 200 })
      : HttpResponse.json<Record<string, unknown>>({ message: "Compra no encontrada." }, { status: 404 });
  }),
  http.patch(`${apiUrl}/purchases/:id`, async ({ params, request }) => {
    const purchase = mockPurchases.find(
      (candidate) => candidate.id === params.id && !candidate.deletedAt,
    );
    if (!purchase) {
      return HttpResponse.json<Record<string, unknown>>(
        { message: "Compra no encontrada." },
        { status: 404 },
      );
    }

    const body = await request.json() as UpdatePurchaseRequest;
    const supplier = mockPurchaseSuppliers.find((item) => item.id === body.supplierId);
    const totalQuantity = body.variants.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = body.variants.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    Object.assign(purchase, {
      supplier: { id: body.supplierId, name: supplier?.name ?? "Proveedor seleccionado" },
      purchaseDate: body.purchaseDate,
      productName: body.productName,
      categoryId: body.categoryId,
      brand: body.brand,
      invoiceUrl: body.invoiceUrl,
      totalQuantity,
      totalAmount,
      items: body.variants.map((item, index) => ({
        id: purchase.items[index]?.id ?? makeId(),
        sku: purchase.items[index]?.sku ?? `MOCK-${Date.now()}-${index + 1}`,
        ...item,
        color: item.color.toUpperCase(),
        subtotal: item.quantity * item.unitCost,
      })),
    });

    return HttpResponse.json<Record<string, unknown>>({ data: purchase, statusCode: 200 });
  }),
  http.delete(`${apiUrl}/purchases/:id`, ({ params }) => { const item = mockPurchases.find((candidate) => candidate.id === params.id); if (!item) return HttpResponse.json<Record<string, unknown>>({ message: "Compra no encontrada." }, { status: 404 }); item.deletedAt = new Date().toISOString(); return HttpResponse.json<Record<string, unknown>>({ message: "Compra eliminada correctamente." }); }),
];
