import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getPublishedEvents } from "@/server/dal/event";

const describeWithDatabase = process.env.TEST_DATABASE_URL && process.env.TEST_DIRECT_URL ? describe : describe.skip;

const baseEvent = {
  address: "Jalan Integrasi Nomor 1",
  city: "Malang",
  province: "Jawa Timur",
  latitude: -7.98,
  longitude: 112.62,
  sourceDb: 120,
  sourcePlatform: "Situs Resmi",
  sourceUrl: "https://example.com/integrasi",
  startAt: new Date("2027-01-01T10:00:00.000Z"),
  endAt: new Date("2027-01-01T12:00:00.000Z"),
};

describeWithDatabase("query acara publik", () => {
  beforeEach(async () => {
    await prisma.auditLog.deleteMany();
    await prisma.soundEvent.deleteMany();
  });

  it("hanya mengembalikan acara berstatus PUBLISHED", async () => {
    await prisma.soundEvent.createMany({
      data: [
        { ...baseEvent, title: "Terbit", slug: "terbit", publicationStatus: "PUBLISHED" },
        { ...baseEvent, title: "Draf", slug: "draf", publicationStatus: "DRAFT" },
        { ...baseEvent, title: "Arsip", slug: "arsip", publicationStatus: "ARCHIVED" },
      ],
    });

    const result = await getPublishedEvents();
    expect(result.map((event) => event.slug)).toEqual(["terbit"]);
  });

  it("mengirim metadata streaming tanpa menyerialisasi BLOB audio", async () => {
    const event = await prisma.soundEvent.create({
      data: {
        ...baseEvent,
        title: "Terbit Dengan Musik",
        slug: "terbit-dengan-musik",
        publicationStatus: "PUBLISHED",
        audioTitle: "Musik Test",
        audioFileName: "test.mp3",
        audioMimeType: "audio/mpeg",
        audioSize: 3,
        audioData: Buffer.from([0x49, 0x44, 0x33]),
      },
    });

    const [result] = await getPublishedEvents();
    expect(result).toMatchObject({
      id: event.id,
      hasAudio: true,
      audioFileName: "test.mp3",
    });
    expect(result.audioStreamUrl).toContain(`/api/events/${event.id}/audio?v=`);
    expect("audioData" in result).toBe(false);
  });
});
