import { NextResponse } from "next/server";

import {
  deleteAuthToken,
  getAuthSession,
} from "@/lib/session";

export async function GET() {
  const session = await getAuthSession({
    refreshOnUnauthorized: true,
  });

  if (!session) {
    await deleteAuthToken();

    return NextResponse.json(
      {
        type: "unauthorized",
        message: "No existe una sesión activa.",
      },
      { status: 401 },
    );
  }

  return NextResponse.json(session);
}

export async function DELETE() {
  // Logout local: Backend no dispone todavía de endpoint para revocar el token.
  await deleteAuthToken();

  return new NextResponse(null, { status: 204 });
}
