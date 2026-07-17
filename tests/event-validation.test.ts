import { describe, expect, it } from "vitest";
import { createSlug } from "@/lib/domain/slug";
import { EventSchema } from "@/lib/validations/event";

const validEvent = {
  title: "Acara Valid",
  slug: "acara-valid",
  address: "Jalan Valid Nomor 1",
  city: "Malang",
  province: "Jawa Timur",
  latitude: -7.98,
  longitude: 112.62,
  sourceDb: 120,
  sourcePlatform: "Situs Resmi",
  sourceUrl: "https://example.com/acara",
  audioTitle: "Musik Pembuka",
  startAt: new Date("2027-01-01T10:00:00.000Z"),
  endAt: new Date("2027-01-01T12:00:00.000Z"),
  publicationStatus: "DRAFT" as const,
};

describe("validasi acara", () => {
  it("menerima payload lengkap yang valid", () => {
    expect(EventSchema.safeParse(validEvent).success).toBe(true);
  });

  it.each(["", null, Number.NaN])("memperlakukan koordinat kosong %s sebagai tidak diisi", (emptyCoordinate) => {
    const result = EventSchema.safeParse({ ...validEvent, latitude: emptyCoordinate });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("latitude"))).toBe(true);
    }
  });

  it.each([
    ["latitude minimum", { latitude: -91 }],
    ["latitude maksimum", { latitude: 91 }],
    ["longitude minimum", { longitude: -181 }],
    ["longitude maksimum", { longitude: 181 }],
    ["dB terlalu rendah", { sourceDb: 79 }],
    ["dB terlalu tinggi", { sourceDb: 161 }],
    ["protokol URL non-HTTP", { sourceUrl: "ftp://example.com/acara" }],
    ["waktu selesai sebelum mulai", { endAt: new Date("2027-01-01T09:00:00.000Z") }],
  ])("menolak %s", (_label, override) => {
    expect(EventSchema.safeParse({ ...validEvent, ...override }).success).toBe(false);
  });

  it("menerima judul musik kosong sebagai field opsional", () => {
    const result = EventSchema.safeParse({ ...validEvent, audioTitle: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.audioTitle).toBeNull();
    }
  });
});

describe("normalisasi slug", () => {
  it("menormalisasi spasi, simbol, dan diakritik", () => {
    expect(createSlug("  Horeg Café: Malam Besar!  ")).toBe("horeg-cafe-malam-besar");
  });

  it("tidak menyisakan strip ganda atau strip tepi", () => {
    expect(createSlug("---Sound---Horeg---")).toBe("sound-horeg");
  });
});
