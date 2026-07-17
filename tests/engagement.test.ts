import { describe, expect, it } from "vitest";
import {
  AdminCommentCreateSchema,
  AnonymousCommentSchema,
  EventLikeSchema,
} from "@/lib/validations/engagement";
import { canAdminEditComment, formatCompactCount } from "@/lib/engagement";

const requestId = "550e8400-e29b-41d4-a716-446655440000";

describe("validasi engagement acara", () => {
  it("menormalisasi komentar anonim tanpa mengubah baris baru", () => {
    const result = AnonymousCommentSchema.parse({
      body: "  Informasi baris satu\r\nbaris dua  ",
      clientRequestId: requestId,
      website: "",
    });
    expect(result.body).toBe("Informasi baris satu\nbaris dua");
  });

  it.each(["", " ", "a".repeat(501)])("menolak komentar anonim tidak valid", (body) => {
    expect(AnonymousCommentSchema.safeParse({ body, clientRequestId: requestId, website: "" }).success).toBe(false);
  });

  it("menolak honeypot yang terisi dan request id non-UUID", () => {
    expect(AnonymousCommentSchema.safeParse({ body: "Valid", clientRequestId: "retry-1", website: "bot" }).success).toBe(false);
  });

  it("menerima hanya boolean untuk status like", () => {
    expect(EventLikeSchema.safeParse({ liked: true }).success).toBe(true);
    expect(EventLikeSchema.safeParse({ liked: "true" }).success).toBe(false);
  });

  it("memvalidasi komentar ADMIN dengan event ID", () => {
    expect(AdminCommentCreateSchema.safeParse({ eventId: "event-1", body: "  Pengumuman resmi  " }).success).toBe(true);
    expect(AdminCommentCreateSchema.safeParse({ eventId: "", body: "Pengumuman" }).success).toBe(false);
  });
});

describe("format hitungan engagement", () => {
  it.each([[0, "0"], [42, "42"], [99, "99"], [100, "99+"], [1200, "99+"]])(
    "memformat %i menjadi %s",
    (value, expected) => expect(formatCompactCount(value)).toBe(expected),
  );
});

describe("otorisasi edit komentar", () => {
  it("hanya mengizinkan komentar ADMIN untuk diedit", () => {
    expect(canAdminEditComment("ADMIN")).toBe(true);
    expect(canAdminEditComment("ANONYMOUS")).toBe(false);
  });
});
