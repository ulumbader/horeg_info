import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  createAnonymousComment,
  getEngagementSummary,
  getPublicComments,
  setEventLike,
} from "@/server/dal/engagement";

const hasTestDatabase = Boolean(process.env.TEST_DATABASE_URL && process.env.TEST_DIRECT_URL);
const describeDatabase = hasTestDatabase ? describe : describe.skip;

describeDatabase("engagement acara pada PostgreSQL terisolasi", () => {
  const suffix = randomUUID();
  let eventId = "";

  beforeAll(async () => {
    const event = await prisma.soundEvent.create({
      data: {
        slug: `engagement-${suffix}`,
        title: "Engagement Integration",
        address: "Jalan Test",
        city: "Malang",
        province: "Jawa Timur",
        latitude: -7.9,
        longitude: 112.6,
        sourceDb: 110,
        sourcePlatform: "Test",
        sourceUrl: "https://example.test/event",
        startAt: new Date("2027-01-01T10:00:00.000Z"),
        endAt: new Date("2027-01-01T12:00:00.000Z"),
        publicationStatus: "PUBLISHED",
      },
    });
    eventId = event.id;
  });

  afterAll(async () => {
    if (eventId) await prisma.soundEvent.delete({ where: { id: eventId } });
  });

  it("menjaga like idempoten per actor", async () => {
    const actorHash = "a".repeat(64);
    await setEventLike(eventId, actorHash, true);
    await setEventLike(eventId, actorHash, true);
    expect((await getEngagementSummary(eventId, actorHash)).likeCount).toBe(1);
    expect((await setEventLike(eventId, actorHash, false)).likeCount).toBe(0);
  });

  it("membuat komentar anonim idempoten dan memaginasi komentar aktif", async () => {
    const input = {
      eventId,
      actorHash: "b".repeat(64),
      clientRequestId: randomUUID(),
      body: "Komentar integrasi",
    };
    const first = await createAnonymousComment(input);
    const repeated = await createAnonymousComment(input);
    expect(repeated.id).toBe(first.id);
    expect((await getPublicComments(eventId)).comments).toHaveLength(1);

    await prisma.eventComment.update({ where: { id: first.id }, data: { deletedAt: new Date() } });
    expect((await getEngagementSummary(eventId, input.actorHash)).commentCount).toBe(0);
    expect((await getPublicComments(eventId)).comments).toHaveLength(0);
  });
});
