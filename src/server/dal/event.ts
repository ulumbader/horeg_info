import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import "server-only";

const eventDtoSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  description: true,
  venueName: true,
  address: true,
  district: true,
  city: true,
  province: true,
  latitude: true,
  longitude: true,
  sourceDb: true,
  sourcePlatform: true,
  sourceUrl: true,
  sourceAccount: true,
  audioTitle: true,
  audioFileName: true,
  audioSize: true,
  startAt: true,
  endAt: true,
  publicationStatus: true,
  featured: true,
  publishedAt: true,
  updatedAt: true,
  _count: {
    select: {
      likes: true,
      comments: { where: { deletedAt: null } },
    },
  },
} satisfies Prisma.SoundEventSelect;

type EventDtoRecord = Prisma.SoundEventGetPayload<{ select: typeof eventDtoSelect }>;

export type PublicSoundEventDTO = Omit<EventDtoRecord, "updatedAt" | "_count"> & {
  hasAudio: boolean;
  audioStreamUrl: string | null;
  likeCount: number;
  commentCount: number;
};

function mapToPublicDTO(event: EventDtoRecord): PublicSoundEventDTO {
  const { updatedAt, _count, ...rest } = event;
  const hasAudio = typeof event.audioSize === "number" && event.audioSize > 0;
  return {
    ...rest,
    likeCount: _count.likes,
    commentCount: _count.comments,
    hasAudio,
    audioStreamUrl: hasAudio ? `/api/events/${event.id}/audio?v=${updatedAt.getTime()}` : null,
  };
}

export async function getPublishedEvents() {
  const events = await prisma.soundEvent.findMany({
    where: { publicationStatus: "PUBLISHED" },
    orderBy: { startAt: "asc" },
    select: eventDtoSelect,
  });
  return events.map(mapToPublicDTO);
}

export async function getPublishedEventBySlug(slug: string) {
  const event = await prisma.soundEvent.findUnique({
    where: { slug, publicationStatus: "PUBLISHED" },
    select: eventDtoSelect,
  });
  return event ? mapToPublicDTO(event) : null;
}

export async function getAdminEvents(page: number = 1, limit: number = 10, search?: string, status?: string) {
  const where: import("@prisma/client").Prisma.SoundEventWhereInput = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { venueName: { contains: search, mode: "insensitive" } }
    ];
  }
  if (status && status !== 'ALL') {
    where.publicationStatus = status;
  }
  
  const [items, total] = await Promise.all([
    prisma.soundEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        city: true,
        startAt: true,
        publicationStatus: true,
        audioSize: true,
      },
    }),
    prisma.soundEvent.count({ where })
  ]);
  
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getAdminEventById(id: string) {
  const event = await prisma.soundEvent.findUnique({
    where: { id },
    select: eventDtoSelect,
  });
  return event ? mapToPublicDTO(event) : null;
}

export async function getAdminDashboardStats() {
  const now = new Date();
  
  const [
    total, 
    published, 
    draft, 
    archived,
    past,
    ongoingUpcoming,
    upcomingEvents
  ] = await Promise.all([
    prisma.soundEvent.count(),
    prisma.soundEvent.count({ where: { publicationStatus: "PUBLISHED" } }),
    prisma.soundEvent.count({ where: { publicationStatus: "DRAFT" } }),
    prisma.soundEvent.count({ where: { publicationStatus: "ARCHIVED" } }),
    prisma.soundEvent.count({ where: { endAt: { lt: now } } }),
    prisma.soundEvent.count({ where: { endAt: { gte: now } } }),
    prisma.soundEvent.findMany({
      where: { startAt: { gte: now } },
      orderBy: { startAt: "asc" },
      take: 5,
      select: { id: true, title: true, city: true, startAt: true, publicationStatus: true },
    })
  ]);

  return { total, published, draft, archived, past, ongoingUpcoming, upcomingEvents };
}
