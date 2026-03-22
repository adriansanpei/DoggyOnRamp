import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export function verifyAdmin(request: Request): NextResponse | null {
  if (!ADMIN_PASSWORD) return null; // No password configured = open (dev)
  const auth = request.headers.get("authorization");
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null; // null = authorized
}
