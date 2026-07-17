"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { canAdminEditComment } from "@/lib/engagement";
import {
  AdminCommentCreateSchema,
  AdminCommentUpdateSchema,
  CommentIdSchema,
} from "@/lib/validations/engagement";
import { requireAdmin } from "@/server/auth";

type CommentActionResult = { success: true } | { success: false; error: string };

function refreshCommentViews() {
  revalidatePath("/");
  revalidatePath("/admin/comments");
}

function safeActionError(error: unknown) {
  console.error("Mutasi komentar admin gagal", { name: error instanceof Error ? error.name : "UnknownError" });
  return { success: false, error: "Komentar tidak dapat diperbarui. Silakan coba lagi." } as const;
}

export async function createAdminComment(input: { eventId: string; body: string }): Promise<CommentActionResult> {
  const session = await requireAdmin();
  const parsed = AdminCommentCreateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Komentar tidak valid" };

  try {
    await prisma.$transaction(async (tx) => {
      const event = await tx.soundEvent.findUnique({ where: { id: parsed.data.eventId }, select: { id: true, title: true } });
      if (!event) throw new Error("EVENT_NOT_FOUND");
      const comment = await tx.eventComment.create({
        data: {
          eventId: event.id,
          body: parsed.data.body,
          authorType: "ADMIN",
          adminUserId: session.user.id,
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          eventType: "COMMENT_CREATE",
          description: `Admin ${session.user.email} created admin comment ${comment.id} for event ${event.id} (${event.title})`,
        },
      });
    });
    refreshCommentViews();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "EVENT_NOT_FOUND") return { success: false, error: "Acara tidak ditemukan" };
    return safeActionError(error);
  }
}

export async function updateAdminComment(input: { id: string; body: string }): Promise<CommentActionResult> {
  const session = await requireAdmin();
  const parsed = AdminCommentUpdateSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Komentar tidak valid" };

  try {
    await prisma.$transaction(async (tx) => {
      const comment = await tx.eventComment.findUnique({
        where: { id: parsed.data.id },
        select: { id: true, authorType: true, deletedAt: true },
      });
      if (!comment || comment.deletedAt) throw new Error("COMMENT_NOT_FOUND");
      if (!canAdminEditComment(comment.authorType)) throw new Error("ANONYMOUS_EDIT_FORBIDDEN");
      await tx.eventComment.update({
        where: { id: comment.id },
        data: { body: parsed.data.body, editedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          eventType: "COMMENT_UPDATE",
          description: `Admin ${session.user.email} updated admin comment ${comment.id}`,
        },
      });
    });
    refreshCommentViews();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ANONYMOUS_EDIT_FORBIDDEN") {
      return { success: false, error: "Komentar anonim tidak boleh diedit" };
    }
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND") return { success: false, error: "Komentar tidak ditemukan" };
    return safeActionError(error);
  }
}

export async function deleteComment(id: string): Promise<CommentActionResult> {
  const session = await requireAdmin();
  const parsed = CommentIdSchema.safeParse(id);
  if (!parsed.success) return { success: false, error: "ID komentar tidak valid" };

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.eventComment.updateMany({
        where: { id: parsed.data, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (updated.count !== 1) throw new Error("COMMENT_NOT_FOUND");
      await tx.auditLog.create({
        data: {
          eventType: "COMMENT_DELETE",
          description: `Admin ${session.user.email} soft-deleted comment ${parsed.data}`,
        },
      });
    });
    refreshCommentViews();
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "COMMENT_NOT_FOUND") return { success: false, error: "Komentar tidak ditemukan" };
    return safeActionError(error);
  }
}
