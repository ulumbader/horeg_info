import { NextRequest, NextResponse } from "next/server";
import { applyAnonymousIdentityCookie, resolveAnonymousIdentity } from "@/server/anonymous-identity";
import { getEngagementSummary, getPublishedEventIdentity } from "@/server/dal/engagement";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await context.params;
    const event = await getPublishedEventIdentity(slug);
    if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

    const identity = resolveAnonymousIdentity(request);
    const summary = await getEngagementSummary(event.id, identity.actorHash);
    return applyAnonymousIdentityCookie(NextResponse.json(summary), identity.cookieValue);
  } catch (error: unknown) {
    console.error("Gagal membaca engagement acara", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Engagement tidak dapat dimuat" }, { status: 500 });
  }
}
