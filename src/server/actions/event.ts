"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth";
import { EventSchema, EventFormData } from "@/lib/validations/event";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AudioUploadError, parseEventAudioUpload } from "@/server/event-audio";

const EventIdSchema = z.string().min(1).max(128);
const SAFE_EVENT_ERRORS = new Set(["Slug sudah digunakan", "Slug sudah digunakan acara lain", "Acara tidak ditemukan"]);

function mutationError(error: unknown) {
  if (error instanceof AudioUploadError) return error.message;
  if (error instanceof Error && SAFE_EVENT_ERRORS.has(error.message)) return error.message;
  console.error("Mutasi acara gagal", { name: error instanceof Error ? error.name : "UnknownError" });
  return "Terjadi kesalahan server. Silakan coba lagi.";
}

export async function createEvent(data: EventFormData, audioUpload?: FormData) {
  const session = await requireAdmin();
  
  const parsed = EventSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid", details: parsed.error.format() };
  }
  
  const payload = parsed.data;

  try {
    const audioMutation = await parseEventAudioUpload(audioUpload, false);
    const event = await prisma.$transaction(async (tx) => {
      const existingSlug = await tx.soundEvent.findUnique({ where: { slug: payload.slug } });
      if (existingSlug) {
        throw new Error("Slug sudah digunakan");
      }

      const newEvent = await tx.soundEvent.create({
        data: {
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          description: payload.description,
          venueName: payload.venueName,
          address: payload.address,
          district: payload.district,
          city: payload.city,
          province: payload.province,
          latitude: payload.latitude,
          longitude: payload.longitude,
          sourceDb: payload.sourceDb,
          sourcePlatform: payload.sourcePlatform,
          sourceUrl: payload.sourceUrl,
          sourceAccount: payload.sourceAccount,
          audioUrl: null,
          audioTitle: audioMutation.audioData === null ? null : payload.audioTitle,
          ...audioMutation,
          startAt: payload.startAt,
          endAt: payload.endAt,
          publicationStatus: payload.publicationStatus,
          publishedAt: payload.publicationStatus === "PUBLISHED" ? new Date() : null,
        },
        select: { id: true, title: true, publicationStatus: true },
      });

      await tx.auditLog.create({
        data: {
          eventType: "EVENT_CREATE",
          description: `User ${session.user.email} created event ${newEvent.id} (${newEvent.title}) with status ${newEvent.publicationStatus}`
        }
      });

      return newEvent;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    if (event.publicationStatus === "PUBLISHED") {
      revalidatePath("/");
    }
    
    return { success: true, event };
  } catch (error: unknown) {
    return { success: false, error: mutationError(error) };
  }
}

export async function updateEvent(id: string, data: EventFormData, audioUpload?: FormData) {
  const session = await requireAdmin();
  const parsedId = EventIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: "ID acara tidak valid" };
  
  const parsed = EventSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid", details: parsed.error.format() };
  }
  
  const payload = parsed.data;

  try {
    const audioMutation = await parseEventAudioUpload(audioUpload, true);
    const event = await prisma.$transaction(async (tx) => {
      const existingSlug = await tx.soundEvent.findFirst({
        where: { slug: payload.slug, NOT: { id: parsedId.data } }
      });
      if (existingSlug) {
        throw new Error("Slug sudah digunakan acara lain");
      }
      
      const oldEvent = await tx.soundEvent.findUnique({
        where: { id: parsedId.data },
        select: { id: true, publicationStatus: true },
      });
      if (!oldEvent) throw new Error("Acara tidak ditemukan");

      const isPublishingNow = oldEvent.publicationStatus !== "PUBLISHED" && payload.publicationStatus === "PUBLISHED";

      const updatedEvent = await tx.soundEvent.update({
        where: { id: parsedId.data },
        data: {
          title: payload.title,
          slug: payload.slug,
          summary: payload.summary,
          description: payload.description,
          venueName: payload.venueName,
          address: payload.address,
          district: payload.district,
          city: payload.city,
          province: payload.province,
          latitude: payload.latitude,
          longitude: payload.longitude,
          sourceDb: payload.sourceDb,
          sourcePlatform: payload.sourcePlatform,
          sourceUrl: payload.sourceUrl,
          sourceAccount: payload.sourceAccount,
          audioUrl: null,
          audioTitle: audioMutation.audioData === null ? null : payload.audioTitle,
          ...audioMutation,
          startAt: payload.startAt,
          endAt: payload.endAt,
          publicationStatus: payload.publicationStatus,
          ...(isPublishingNow ? { publishedAt: new Date() } : {})
        },
        select: { id: true, title: true, publicationStatus: true },
      });

      await tx.auditLog.create({
        data: {
          eventType: "EVENT_UPDATE",
          description: `User ${session.user.email} updated event ${updatedEvent.id} (${updatedEvent.title})`
        }
      });

      return updatedEvent;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/");
    
    return { success: true, event };
  } catch (error: unknown) {
    return { success: false, error: mutationError(error) };
  }
}

export async function changeEventStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  const session = await requireAdmin();
  const parsedId = EventIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: "ID acara tidak valid" };
  try {
    const event = await prisma.$transaction(async (tx) => {
      const old = await tx.soundEvent.findUnique({ where: { id: parsedId.data } });
      if (!old) throw new Error("Acara tidak ditemukan");
      
      const updated = await tx.soundEvent.update({
        where: { id: parsedId.data },
        data: { 
          publicationStatus: status,
          ...(status === "PUBLISHED" && old.publicationStatus !== "PUBLISHED" ? { publishedAt: new Date() } : {})
        }
      });

      await tx.auditLog.create({
        data: {
          eventType: `EVENT_STATUS_${status}`,
          description: `User ${session.user.email} changed status of event ${updated.id} to ${status}`
        }
      });

      return updated;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return { success: true, event };
  } catch (error: unknown) {
    return { success: false, error: mutationError(error) };
  }
}

export async function deleteEvent(id: string) {
  const session = await requireAdmin();
  const parsedId = EventIdSchema.safeParse(id);
  if (!parsedId.success) return { success: false, error: "ID acara tidak valid" };
  try {
    await prisma.$transaction(async (tx) => {
      const old = await tx.soundEvent.findUnique({ where: { id: parsedId.data } });
      if (!old) throw new Error("Acara tidak ditemukan");
      
      await tx.soundEvent.delete({ where: { id: parsedId.data } });

      await tx.auditLog.create({
        data: {
          eventType: "EVENT_DELETE",
          description: `User ${session.user.email} permanently deleted event ${parsedId.data} (${old.title})`
        }
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/");

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: mutationError(error) };
  }
}
