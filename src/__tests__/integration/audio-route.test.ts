import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "@/app/api/events/[id]/audio/route";

const describeWithDatabase = process.env.TEST_DATABASE_URL && process.env.TEST_DIRECT_URL ? describe : describe.skip;

const baseEvent = {
  title: "Acara Audio Route",
  slug: "acara-audio-route",
  address: "Jalan Audio Nomor 1",
  city: "Malang",
  province: "Jawa Timur",
  latitude: -7.98,
  longitude: 112.62,
  sourceDb: 120,
  sourcePlatform: "Situs Resmi",
  sourceUrl: "https://example.com/audio",
  startAt: new Date("2027-01-01T10:00:00.000Z"),
  endAt: new Date("2027-01-01T12:00:00.000Z"),
  publicationStatus: "PUBLISHED",
  audioTitle: "Musik Route",
  audioFileName: "route.mp3",
  audioMimeType: "audio/mpeg",
  audioSize: 6,
  audioData: Buffer.from([0x49, 0x44, 0x33, 0x04, 0x05, 0x06]),
};

describeWithDatabase("streaming audio acara", () => {
  beforeEach(async () => {
    await prisma.soundEvent.deleteMany();
  });

  it("mengembalikan MP3 penuh dan mendukung byte range", async () => {
    const event = await prisma.soundEvent.create({ data: baseEvent });

    const full = await GET(new Request(`http://localhost/api/events/${event.id}/audio`), {
      params: Promise.resolve({ id: event.id }),
    });
    expect(full.status).toBe(200);
    expect(full.headers.get("content-type")).toBe("audio/mpeg");
    expect(new Uint8Array(await full.arrayBuffer())).toEqual(new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x05, 0x06]));

    const partial = await GET(new Request(`http://localhost/api/events/${event.id}/audio`, {
      headers: { Range: "bytes=1-3" },
    }), { params: Promise.resolve({ id: event.id }) });
    expect(partial.status).toBe(206);
    expect(partial.headers.get("content-range")).toBe("bytes 1-3/6");
    expect(new Uint8Array(await partial.arrayBuffer())).toEqual(new Uint8Array([0x44, 0x33, 0x04]));
  });

  it("menolak range di luar ukuran file", async () => {
    const event = await prisma.soundEvent.create({ data: { ...baseEvent, slug: "audio-range-invalid" } });
    const response = await GET(new Request(`http://localhost/api/events/${event.id}/audio`, {
      headers: { Range: "bytes=99-100" },
    }), { params: Promise.resolve({ id: event.id }) });
    expect(response.status).toBe(416);
  });
});
