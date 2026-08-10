import type { NextRequest } from "next/server";
import { forwardPurchasesRequest } from "@/lib/purchases-api";
export async function POST(request: NextRequest) { return forwardPurchasesRequest("/purchases/nuevo-producto", { method: "POST", headers: { "Content-Type": "application/json" }, body: await request.text() }); }
