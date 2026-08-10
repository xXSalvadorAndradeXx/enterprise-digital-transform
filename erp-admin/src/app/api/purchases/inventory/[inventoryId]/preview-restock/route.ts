import { forwardPurchasesRequest } from "@/lib/purchases-api";
export async function GET(_request: Request, context: { params: Promise<{ inventoryId: string }> }) { const { inventoryId } = await context.params; return forwardPurchasesRequest(`/purchases/inventory/${encodeURIComponent(inventoryId)}/preview-restock`, { method: "GET" }); }
