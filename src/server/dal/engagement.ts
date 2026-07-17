import "server-only";

import { prisma } from "@/lib/prisma";
import type { PublicCommentDTO } from "@/lib/engagement";
import type { CommentAuthorType, Prisma } from "@prisma/client";

const PUBLIC_COMMENT_PAGE_SIZE = 20;

function mapPublicComment(comment: {
  id: string;
  body: string;
  authorType: "ANONYMOUS" | "ADMIN";
  createdAt: Date;
  editedAt: Date | null;
}): PublicCommentDTO {
  return {
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    editedAt: comment.editedAt?.toISOString() ?? null,
  };
}

export async function getPublishedEventIdentity(slug: string) {
  return prisma.soundEvent.findFirst({
    where: { slug, publicationStatus: "PUBLISHED" },
    select: { id: true },
  });
}

export async function getEngagementSummary(eventId: string, actorHash: string) {
  const [likeCount, commentCount, viewerLike] = await Promise.all([
    prisma.eventLike.count({ where: { eventId } }),
    prisma.eventComment.count({ where: { eventId, deletedAt: null } }),
    prisma.eventLike.findUnique({
      where: { eventId_actorHash: { eventId, actorHash } },
      select: { id: true },
    }),
  ]);
  return { likeCount, commentCount, viewerLiked: Boolean(viewerLike) };
}

export async function getPublicComments(eventId: string, cursor?: string) {
  const comments = await prisma.eventComment.findMany({
    where: { eventId, deletedAt: null },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PUBLIC_COMMENT_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, body: true, authorType: true, createdAt: true, editedAt: true },
  });
  const hasMore = comments.length > PUBLIC_COMMENT_PAGE_SIZE;
  const page = comments.slice(0, PUBLIC_COMMENT_PAGE_SIZE);
  return {
    comments: page.map(mapPublicComment),
    nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
  };
}

export async function enforceAnonymousCommentRateLimit(actorHash: string) {
  const now = Date.now();
  const [lastComment, recentCount, dailyCount] = await Promise.all([
    prisma.eventComment.findFirst({
      where: { anonymousActorHash: actorHash },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.eventComment.count({
      where: { anonymousActorHash: actorHash, createdAt: { gte: new Date(now - 10 * 60 * 1000) } },
    }),
    prisma.eventComment.count({
      where: { anonymousActorHash: actorHash, createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  if (lastComment && now - lastComment.createdAt.getTime() < 20_000) return "Tunggu sebentar sebelum mengirim komentar lagi.";
  if (recentCount >= 5 || dailyCount >= 20) return "Batas komentar tercapai. Silakan coba lagi nanti.";
  return null;
}

export async function findAnonymousCommentByRequest(actorHash: string, clientRequestId: string) {
  const comment = await prisma.eventComment.findUnique({
    where: {
      anonymousActorHash_clientRequestId: {
        anonymousActorHash: actorHash,
        clientRequestId,
      },
    },
    select: { id: true, body: true, authorType: true, createdAt: true, editedAt: true },
  });
  return comment ? mapPublicComment(comment) : null;
}

export async function createAnonymousComment(input: {
  eventId: string;
  actorHash: string;
  clientRequestId: string;
  body: string;
}) {
  const existing = await findAnonymousCommentByRequest(input.actorHash, input.clientRequestId);
  if (existing) return existing;

  const created = await prisma.eventComment.create({
    data: {
      eventId: input.eventId,
      anonymousActorHash: input.actorHash,
      clientRequestId: input.clientRequestId,
      body: input.body,
      authorType: "ANONYMOUS",
    },
    select: { id: true, body: true, authorType: true, createdAt: true, editedAt: true },
  });
  return mapPublicComment(created);
}

export async function setEventLike(eventId: string, actorHash: string, liked: boolean) {
  return prisma.$transaction(async (tx) => {
    if (liked) {
      await tx.eventLike.upsert({
        where: { eventId_actorHash: { eventId, actorHash } },
        update: {},
        create: { eventId, actorHash },
      });
    } else {
      await tx.eventLike.deleteMany({ where: { eventId, actorHash } });
    }
    const likeCount = await tx.eventLike.count({ where: { eventId } });
    return { liked, likeCount };
  });
}

export async function getAdminCommentOptions() {
  return prisma.soundEvent.findMany({
    orderBy: [{ publicationStatus: "asc" }, { title: "asc" }],
    select: { id: true, title: true, publicationStatus: true },
  });
}

export async function getAdminComments(input: {
  page: number;
  limit?: number;
  search?: string;
  authorType?: CommentAuthorType;
}) {
  const limit = input.limit ?? 15;
  const where: Prisma.EventCommentWhereInput = {
    deletedAt: null,
    ...(input.authorType ? { authorType: input.authorType } : {}),
  };
  if (input.search) {
    where.OR = [
      { body: { contains: input.search, mode: "insensitive" } },
      { event: { title: { contains: input.search, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.eventComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * limit,
      take: limit,
      select: {
        id: true,
        body: true,
        authorType: true,
        createdAt: true,
        editedAt: true,
        adminUserId: true,
        event: { select: { id: true, slug: true, title: true, publicationStatus: true } },
      },
    }),
    prisma.eventComment.count({ where }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      editedAt: item.editedAt?.toISOString() ?? null,
    })),
    total,
    page: input.page,
    totalPages: Math.ceil(total / limit),
  };
}
