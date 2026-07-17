import { NextResponse } from "next/server";
import { recordPageView } from "@/server/dal/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = typeof body?.path === "string" ? body.path : "/";

    // Only track known public paths, sanitize input
    const sanitizedPath = path.startsWith("/") ? path.slice(0, 255) : "/";

    await recordPageView(sanitizedPath);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Silently fail — analytics should never break the user experience
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
