import { z } from "zod";

export const eventFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  summary: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  venueName: z.string().nullable().optional(),
  address: z.string().min(1, "Alamat wajib diisi"),
  district: z.string().nullable().optional(),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  sourceDb: z.number().min(80).max(160),
  sourcePlatform: z.string().min(1, "Platform sumber wajib diisi"),
  sourceUrl: z.url("URL tidak valid").refine((value) => {
    const normalized = value.toLowerCase();
    return normalized.startsWith("http://") || normalized.startsWith("https://");
  }, "URL harus menggunakan http atau https"),
  sourceAccount: z.string().nullable().optional(),
  audioTitle: z.string().max(120, "Judul musik maksimal 120 karakter").nullable().optional().transform((value) => value?.trim() || null),
  startAt: z.date(),
  endAt: z.date(),
}).refine(data => data.endAt > data.startAt, {
  message: "Waktu selesai harus lebih dari waktu mulai",
  path: ["endAt"],
});

export const eventCreateSchema = eventFormSchema;
export const eventUpdateSchema = eventFormSchema.partial();

export const eventFilterSchema = z.object({
  status: z.enum(["upcoming", "past"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  search: z.string().optional(),
});
