import { z } from "zod";

const requiredCoordinate = (label: "Latitude" | "Longitude", minimum: number, maximum: number) => z.preprocess(
  (value) => value === "" || value === null || (typeof value === "number" && Number.isNaN(value))
    ? undefined
    : value,
  z.number({ message: `${label} wajib diisi` }).min(minimum).max(maximum),
);

const requiredDate = (message: string) => z
  .union([z.date(), z.string().min(1, message)])
  .pipe(z.coerce.date({ error: message }));

export const EventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan strip").min(3).max(255),
  summary: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  venueName: z.string().optional().nullable(),
  address: z.string().min(5, "Alamat minimal 5 karakter"),
  district: z.string().optional().nullable(),
  city: z.string().min(3, "Kota minimal 3 karakter"),
  province: z.string().min(3, "Provinsi minimal 3 karakter"),
  latitude: requiredCoordinate("Latitude", -90, 90),
  longitude: requiredCoordinate("Longitude", -180, 180),
  sourceDb: z.number().min(80, "Tingkat sumber minimal 80 dB").max(160, "Tingkat sumber maksimal 160 dB"),
  sourcePlatform: z.string().min(1, "Sumber platform wajib diisi"),
  sourceUrl: z.url("URL sumber tidak valid").refine((value) => {
    const normalized = value.toLowerCase();
    return normalized.startsWith("http://") || normalized.startsWith("https://");
  }, "URL sumber harus menggunakan http atau https"),
  sourceAccount: z.string().optional().nullable(),
  audioTitle: z.string().max(120, "Judul musik maksimal 120 karakter").optional().nullable().transform((value) => value?.trim() || null),
  startAt: requiredDate("Waktu mulai wajib diisi"),
  endAt: requiredDate("Waktu selesai wajib diisi"),
  publicationStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
}).refine(data => data.endAt > data.startAt, {
  message: "Waktu selesai harus lebih besar dari waktu mulai",
  path: ["endAt"],
});

export type EventFormData = z.infer<typeof EventSchema>;
