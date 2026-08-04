import { NextResponse } from "next/server";

import { deleteAuthToken } from "@/lib/session";

export async function POST() {
  await deleteAuthToken();

  return NextResponse.json(
    {
      message: "Sesión finalizada.",
    },
    { status: 200 },
  );
}