import { z } from "zod";

const normalizedCommentBody = z
  .string()
  .transform((value) => value.replace(/\r\n?/g, "\n").trim())
  .pipe(z.string().min(1, "Komentar tidak boleh kosong").max(500, "Komentar maksimal 500 karakter"));

export const AnonymousCommentSchema = z.object({
  body: normalizedCommentBody,
  clientRequestId: z.string().uuid("ID permintaan tidak valid"),
  website: z.string().max(0, "Permintaan tidak valid").optional().default(""),
});

export const EventLikeSchema = z.object({
  liked: z.boolean(),
});

export const AdminCommentCreateSchema = z.object({
  eventId: z.string().min(1).max(128),
  body: normalizedCommentBody,
});

export const AdminCommentUpdateSchema = z.object({
  id: z.string().min(1).max(128),
  body: normalizedCommentBody,
});

export const CommentIdSchema = z.string().min(1).max(128);
