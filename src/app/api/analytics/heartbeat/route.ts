import { NextResponse } from "next/server";
import { upsertActiveVisitor } from "@/server/dal/analytics";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const visitorId = typeof body?.visitorId === "string" ? body.visitorId : null;
    const path = typeof body?.path === "string" ? body.path.slice(0, 255) : "/";

    if (!visitorId || visitorId.length < 10 || visitorId.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    // Extract a safe, truncated user-agent (no sensitive data)
    const ua = request.headers.get("user-agent")?.slice(0, 200) ?? undefined;

    await upsertActiveVisitor(visitorId, path, ua);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    // Silently fail
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
