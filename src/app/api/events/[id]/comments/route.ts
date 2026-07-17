import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { AnonymousCommentSchema } from "@/lib/validations/engagement";
import { applyAnonymousIdentityCookie, resolveAnonymousIdentity } from "@/server/anonymous-identity";
import {
  createAnonymousComment,
  enforceAnonymousCommentRateLimit,
  findAnonymousCommentByRequest,
  getPublicComments,
  getPublishedEventIdentity,
} from "@/server/dal/engagement";
import { hasTrustedMutationOrigin } from "@/server/request-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: slug } = await context.params;
    const event = await getPublishedEventIdentity(slug);
    if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

    const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
    if (cursor && (cursor.length < 1 || cursor.length > 128)) {
      return NextResponse.json({ error: "Cursor tidak valid" }, { status: 400 });
    }
    return NextResponse.json(await getPublicComments(event.id, cursor));
  } catch (error: unknown) {
    console.error("Gagal membaca komentar acara", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Komentar tidak dapat dimuat" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasTrustedMutationOrigin(request)) {
    return NextResponse.json({ error: "Asal permintaan tidak diizinkan" }, { status: 403 });
  }

  try {
    const { id: slug } = await context.params;
    const event = await getPublishedEventIdentity(slug);
    if (!event) return NextResponse.json({ error: "Acara tidak ditemukan" }, { status: 404 });

    const parsed = AnonymousCommentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Komentar tidak valid" }, { status: 400 });
    }

    const identity = resolveAnonymousIdentity(request);
    const existing = await findAnonymousCommentByRequest(identity.actorHash, parsed.data.clientRequestId);
    if (existing) {
      return applyAnonymousIdentityCookie(
        NextResponse.json({ comment: existing }),
        identity.cookieValue,
      );
    }
    const rateLimitError = await enforceAnonymousCommentRateLimit(identity.actorHash);
    if (rateLimitError) {
      return applyAnonymousIdentityCookie(
        NextResponse.json({ error: rateLimitError }, { status: 429 }),
        identity.cookieValue,
      );
    }

    let comment;
    try {
      comment = await createAnonymousComment({
        eventId: event.id,
        actorHash: identity.actorHash,
        clientRequestId: parsed.data.clientRequestId,
        body: parsed.data.body,
      });
    } catch (error: unknown) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")) throw error;
      comment = await createAnonymousComment({
        eventId: event.id,
        actorHash: identity.actorHash,
        clientRequestId: parsed.data.clientRequestId,
        body: parsed.data.body,
      });
    }

    return applyAnonymousIdentityCookie(
      NextResponse.json({ comment }, { status: 201 }),
      identity.cookieValue,
    );
  } catch (error: unknown) {
    console.error("Gagal membuat komentar anonim", { name: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ error: "Komentar tidak dapat dikirim" }, { status: 500 });
  }
}
