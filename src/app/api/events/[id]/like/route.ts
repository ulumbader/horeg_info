import { NextRequest, NextResponse } from "next/server";
import { EventLikeSchema } from "@/lib/validations/engagement";
import { applyAnonymousIdentityCookie, resolveAnonymousIdentity } from "@/server/anonymous-identity";
import { getPublishedEventIdentity, setEventLike } from "@/server/dal/engagement";
import { hasTrustedMutationOrigin } from "@/server/request-origin";

export const runtime = "nodejs";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Asal permintaan tidak diizinkan" }, { status: 403 });
  }

  try {
    const { id: slug } = await context.params;
    const event = await getPublishedEventIdentity(slug);
    if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

    const parsed = EventLikeSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Data like tidak valid" }, { status: 400 });

    const identity = resolveAnonymousIdentity(request);
    const result = await setEventLike(event.id, identity.actorHash, parsed.data.liked);
    return applyAnonymousIdentityCookie(NextResponse.json(result), identity.cookieValue);
  } catch (error: unknown) {
    console.error("Gagal mengubah like acara", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Like tidak dapat diperbarui" }, { status: 500 });
  }
}
