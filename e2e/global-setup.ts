import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_DATABASE_URL, E2E_DIRECT_URL } from "./constants";

export default async function globalSetup() {
  const projectRoot = process.cwd();
  if (!E2E_DATABASE_URL || !E2E_DIRECT_URL) {
    throw new Error("E2E_DATABASE_URL dan E2E_DIRECT_URL wajib diisi dengan schema PostgreSQL test terisolasi.");
  }
  for (const value of [E2E_DATABASE_URL, E2E_DIRECT_URL]) {
    const url = new URL(value);
    const schema = url.searchParams.get("schema");
    if (!url.protocol.startsWith("postgres") || !schema || !schema.startsWith("e2e")) {
      throw new Error("Database E2E wajib PostgreSQL dengan schema terisolasi berawalan 'e2e'.");
    }
  }

  process.env.DATABASE_URL = E2E_DATABASE_URL;
  process.env.DIRECT_URL = E2E_DIRECT_URL;
  const prismaCli = path.resolve(projectRoot, "node_modules/prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "migrate", "reset", "--force", "--skip-seed"], {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: E2E_DATABASE_URL, DIRECT_URL: E2E_DIRECT_URL, RUST_LOG: "info", RUST_BACKTRACE: "1" },
    stdio: "inherit",
  });

  const prisma = new PrismaClient({ datasourceUrl: E2E_DATABASE_URL });
  const userId = randomUUID();
  const now = new Date();
  try {
    await prisma.user.create({
      data: {
        id: userId,
        name: "Admin E2E",
        email: E2E_ADMIN_EMAIL,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: userId,
            providerId: "credential",
            password: await hashPassword(E2E_ADMIN_PASSWORD),
            createdAt: now,
            updatedAt: now,
          },
        },
      },
    });

    await prisma.soundEvent.create({
      data: {
        slug: "acara-e2e-terdahulu",
        title: "Acara E2E Terdahulu",
        address: "Jalan Pengujian Nomor 1",
        city: "Malang",
        province: "Jawa Timur",
        latitude: -7.9839,
        longitude: 112.6214,
        sourceDb: 110,
        sourcePlatform: "Situs Resmi",
        sourceUrl: "https://example.com/acara-e2e",
        startAt: new Date("2025-01-01T10:00:00.000Z"),
        endAt: new Date("2025-01-01T12:00:00.000Z"),
        publicationStatus: "PUBLISHED",
        publishedAt: now,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
