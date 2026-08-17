import type { NextRequest } from "next/server";
import { forwardPurchasesRequest } from "@/lib/purchases-api";
export async function POST(request: NextRequest) { return forwardPurchasesRequest("/purchases/upload-invoice", { method: "POST", body: await request.formData() }); }
