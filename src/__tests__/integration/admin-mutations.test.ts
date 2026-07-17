import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventSchema, EventFormData } from '../../lib/validations/event';
import { createEvent, updateEvent } from '../../server/actions/event';
import { prisma } from '../../lib/prisma';

// Mock Next.js cache and headers
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

// We'll control the requireAdmin mock per test
vi.mock('../../server/auth', () => ({
  requireAdmin: vi.fn(),
}));

import { requireAdmin } from '../../server/auth';

const describeWithDatabase = process.env.TEST_DATABASE_URL && process.env.TEST_DIRECT_URL ? describe : describe.skip;

describeWithDatabase('FASE 09: CRUD Mutations & Validations', () => {
  
  beforeEach(async () => {
    vi.clearAllMocks();
    await prisma.auditLog.deleteMany();
    await prisma.soundEvent.deleteMany();
  });

  describe('Zod Validation', () => {
    it('should reject invalid payload', () => {
      const invalidData = {
        title: "ab", // Too short
        slug: "invalid slug!", // Invalid chars
        startAt: new Date("2026-08-01"),
        endAt: new Date("2026-07-01"), // end before start
      };
      
      const result = EventSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('title'))).toBe(true);
        expect(result.error.issues.some(i => i.path.includes('slug'))).toBe(true);
        expect(result.error.issues.some(i => i.path.includes('latitude'))).toBe(true); // Missing required field
      }
    });

    it('should accept valid payload', () => {
      const validData = {
        title: "Valid Event",
        slug: "valid-event",
        address: "Jalan Valid 1",
        city: "Jakarta",
        province: "DKI Jakarta",
        latitude: -6.2,
        longitude: 106.8,
        sourceDb: 100,
        sourcePlatform: "Instagram",
        sourceUrl: "https://instagram.com",
        startAt: new Date("2026-07-01"),
        endAt: new Date("2026-07-02"),
        publicationStatus: "DRAFT"
      };
      
      const result = EventSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Server Actions Authorization', () => {
    it('should block unauthorized action', async () => {
      // Mock requireAdmin to throw like next/navigation redirect would
      vi.mocked(requireAdmin).mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
      
      const validData = {
        title: "Valid Event",
        slug: "valid-event",
        address: "Jalan Valid 1",
        city: "Jakarta",
        province: "DKI Jakarta",
        latitude: -6.2,
        longitude: 106.8,
        sourceDb: 100,
        sourcePlatform: "Instagram",
        sourceUrl: "https://instagram.com",
        startAt: new Date("2026-07-01"),
        endAt: new Date("2026-07-02"),
        publicationStatus: "DRAFT"
      };

      await expect(createEvent(validData as unknown as EventFormData)).rejects.toThrow("NEXT_REDIRECT");
    });
  });

  describe('Mutasi dengan database test', () => {
    const validData: EventFormData = {
      title: "Acara Integrasi Valid",
      slug: "acara-integrasi-valid",
      address: "Jalan Integrasi Nomor 11",
      city: "Malang",
      province: "Jawa Timur",
      latitude: -7.98,
      longitude: 112.62,
      sourceDb: 120,
      sourcePlatform: "Situs Resmi",
      sourceUrl: "https://example.com/integrasi-valid",
      audioTitle: null,
      startAt: new Date("2027-08-01T10:00:00.000Z"),
      endAt: new Date("2027-08-01T12:00:00.000Z"),
      publicationStatus: "DRAFT",
    };

    it('membuat lalu memperbarui acara valid', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ user: { email: "admin@test.local" } } as Awaited<ReturnType<typeof requireAdmin>>);
      const created = await createEvent(validData);
      expect(created.success).toBe(true);
      if (!created.success || !created.event) throw new Error("Pembuatan acara gagal dalam test");

      const updated = await updateEvent(created.event.id, { ...validData, title: "Acara Integrasi Diperbarui", publicationStatus: "PUBLISHED" });
      expect(updated.success).toBe(true);
      expect(await prisma.soundEvent.findUnique({ where: { id: created.event.id } })).toMatchObject({
        title: "Acara Integrasi Diperbarui",
        publicationStatus: "PUBLISHED",
      });
    });

    it('menyimpan, mengganti metadata, lalu menghapus BLOB MP3', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ user: { email: "admin@test.local" } } as Awaited<ReturnType<typeof requireAdmin>>);
      const upload = new FormData();
      upload.set("audioAction", "REPLACE");
      upload.set("audioFile", new File([new Uint8Array([0x49, 0x44, 0x33, 0x04])], "integrasi.mp3", { type: "audio/mpeg" }));

      const created = await createEvent({ ...validData, slug: "acara-dengan-musik", audioTitle: "Musik Integrasi" }, upload);
      expect(created.success).toBe(true);
      if (!created.success || !created.event) throw new Error("Pembuatan acara dengan musik gagal");

      expect(await prisma.soundEvent.findUnique({ where: { id: created.event.id } })).toMatchObject({
        audioTitle: "Musik Integrasi",
        audioFileName: "integrasi.mp3",
        audioMimeType: "audio/mpeg",
        audioSize: 4,
      });

      const remove = new FormData();
      remove.set("audioAction", "REMOVE");
      const updated = await updateEvent(created.event.id, { ...validData, slug: "acara-dengan-musik", audioTitle: "Tidak dipertahankan" }, remove);
      expect(updated.success).toBe(true);
      expect(await prisma.soundEvent.findUnique({ where: { id: created.event.id } })).toMatchObject({
        audioTitle: null,
        audioData: null,
        audioFileName: null,
        audioMimeType: null,
        audioSize: null,
      });
    });
  });
});
